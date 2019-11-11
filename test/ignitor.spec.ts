/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import { join } from 'path'
import supertest from 'supertest'
import { createServer } from 'http'
import { Filesystem } from '@poppinss/dev-utils'

import { Ignitor } from '../src/Ignitor'

const fs = new Filesystem(join(__dirname, '__app'))
const SECRET = 'asecureandlongrandomsecret'

test.group('Ignitor | App Provider', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.beforeEach(() => {
    process.env.NODE_ENV = 'testing'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    delete process.env.NODE_ENV
    await fs.cleanup()
  })

  test('setup cors before hooks when enabled is set to true', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `
      export const appKey = '${SECRET}'
    `)

    await fs.add(`config/cors.ts`, `
      export const enabled = true
      export const exposeHeaders = []
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()
    const Server = ignitor.application.container.use('Adonis/Core/Server')

    assert.lengthOf(Server.hooks._hooks.before, 1)
  })

  test('setup cors before hooks when enabled is set to a function', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `
      export const appKey = '${SECRET}'
    `)

    await fs.add(`config/cors.ts`, `
      export const enabled = () => false
      export const exposeHeaders = []
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()
    const Server = ignitor.application.container.use('Adonis/Core/Server')

    assert.lengthOf(Server.hooks._hooks.before, 1)
  })

  test('do not setup cors before hooks when enabled is set to false', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `
      export const appKey = '${SECRET}'
    `)

    await fs.add(`config/cors.ts`, `
      export const enabled = false
      export const exposeHeaders = []
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()
    const Server = ignitor.application.container.use('Adonis/Core/Server')

    assert.lengthOf(Server.hooks._hooks.before, 0)
  })
})

test.group('Ignitor | Http', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.beforeEach(() => {
    process.env.NODE_ENV = 'testing'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    delete process.env.NODE_ENV
    await fs.cleanup()
  })

  test('call ready hook on providers before starting the http server', async (assert) => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}',
      '${join(fs.basePath, 'providers/AppProvider.ts')}'
    ]`)

    await fs.add('providers/AppProvider.ts', `
    export default class AppProvider {
      constructor (protected $container) {}

      public async ready () {
        this.$container.use('Adonis/Core/Server').hookCalled = true
      }
    }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer()

    const server = ignitor.application.container.use('Adonis/Core/Server')
    server.instance.close()
    assert.isTrue(server.hookCalled)
  })

  test('start http server to accept incoming requests', async (assert, done) => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    ignitor.application.container.use('Adonis/Core/Route').get('/', () => 'handled')

    await ignitor.startHttpServer((handler) => createServer(handler))
    assert.isTrue(ignitor.application.isReady)

    const server = ignitor.application.container.use('Adonis/Core/Server')
    const { text } = await supertest(server.instance).get('/').expect(200)
    server.instance.close()

    setTimeout(() => {
      assert.isFalse(ignitor.application.isReady)
      assert.equal(text, 'handled')
      done()
    }, 100)
  })

  test('forward errors to app error handler', async (assert) => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await fs.add('app/Exceptions/Handler.ts', `
      export default class Handler {
        async handle (error) {
          return \`handled \${error.message}\`
        }

        report () {
        }
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    await ignitor.startHttpServer((handler) => createServer(handler))
    const server = ignitor.application.container.use('Adonis/Core/Server')

    const { text } = await supertest(server.instance).get('/').expect(404)
    server.instance.close()
    assert.equal(text, 'handled Cannot GET:/')
  })

  test('kill app when server receives error', async (assert) => {
    assert.plan(1)

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    ignitor.kill = async function kill () {
      assert.isTrue(true)
      server.instance.close()
    }

    await ignitor.startHttpServer((handler) => createServer(handler))
    const server = ignitor.application.container.use('Adonis/Core/Server')

    server.instance.emit('error', new Error())
  })

  test('close http server gracefully when closing the app', async (assert, done) => {
    assert.plan(2)

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    await ignitor.startHttpServer((handler) => createServer(handler))
    const server = ignitor.application.container.use('Adonis/Core/Server')
    server.instance.on('close', () => {
      assert.isTrue(true)
      assert.isFalse(ignitor.application.isReady)
      done()
    })

    await ignitor.close()
  })

  test('invoke shutdown method when gracefully closing the app', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}',
      '${join(fs.basePath, 'providers/AppProvider.ts')}'
    ]`)

    await fs.add('providers/AppProvider.ts', `
    export default class AppProvider {
      constructor (protected $container) {}

      public async shutdown () {
        this.$container.use('Adonis/Core/Server').hookCalled = true
      }
    }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    await ignitor.startHttpServer((handler) => createServer(handler))
    const server = ignitor.application.container.use('Adonis/Core/Server')
    await ignitor.close()
    assert.isTrue(server.hookCalled)
  })
})

test.group('Ignitor | Ace', (group) => {
  group.after(async () => {
    await fs.cleanup()
  })

  group.beforeEach(() => {
    process.env.NODE_ENV = 'testing'
  })

  group.afterEach(async () => {
    delete process.env.NODE_ENV
    await fs.cleanup()
  })

  test('do not bootstrap application when running ace command', async (assert) => {
    process.env.TS_NODE = 'true'

    const ignitor = new Ignitor(fs.basePath)
    await fs.add('ace-manifest.json', JSON.stringify({
      foo: {
        commandName: 'foo',
        commandPath: './fooCommand',
      },
    }))

    await fs.add('fooCommand.ts', `export default class FooCommand {
      public static args = []
      public static flags = []

      public static $boot () {
      }

      public handle () {
      }
    }`)

    await ignitor.handleAceCommand(['foo'])
    assert.isFalse(ignitor.bootstraped)
  })

  test('bootstrap application when loadApp setting is true', async (assert) => {
    const ignitor = new Ignitor(fs.basePath)
    await fs.add('ace-manifest.json', JSON.stringify({
      foo: {
        commandName: 'foo',
        commandPath: './foo.ts',
        settings: {
          loadApp: true,
        },
      },
    }))

    await fs.add('foo.ts', `export default class Foo {
      public static args = []
      public static flags = []

      public static $boot () {
      }

      public handle () {
      }
    }`)

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await ignitor.handleAceCommand(['foo'])
    assert.isTrue(ignitor.bootstraped)
  })

  test('generate manifest file', async (assert) => {
    await fs.add('commands/Foo.ts', `
      export default class Foo {
        public static commandName = 'foo'
        public static description = 'Print foo'

        public static args = []
        public static flags = []

        public static $boot () {
        }

        public handle () {
        }
      }
    `)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}',
    ]`)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
      commands: ['./commands/Foo'],
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.handleAceCommand(['generate:manifest'])
    assert.isTrue(ignitor.bootstraped)

    const manifestFile = await fs.get('ace-manifest.json')
    assert.deepEqual(JSON.parse(manifestFile), {
      foo: {
        settings: {},
        commandPath: './commands/Foo',
        commandName: 'foo',
        description: 'Print foo',
        args: [],
        flags: [],
      },
    })
  })
})
