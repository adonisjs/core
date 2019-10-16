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

test.group('Ignitor | Setup', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('setup application', async (assert) => {
    const ignitor = new Ignitor(fs.basePath)
    assert.exists(ignitor.application.version)
    assert.equal(ignitor.application.appName, '@adonisjs/core')
  })

  test('register and boot providers', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `
      const Env = global[Symbol.for('ioc.use')]('Adonis/Core/Env')
      export const appKey = Env.get('APP_KEY')
    `)

    await fs.add(`.env`, `APP_KEY=${SECRET}`)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    assert.deepEqual(
      ignitor.application.container.use('Adonis/Core/Config'),
      ignitor.application.container.use('Adonis/Core/Config'),
    )

    assert.deepEqual(
      ignitor.application.container.use('Adonis/Core/Env'),
      ignitor.application.container.use('Adonis/Core/Env'),
    )

    assert.deepEqual(
      ignitor.application.container.use('Adonis/Core/Route'),
      ignitor.application.container.use('Adonis/Core/Route'),
    )

    assert.deepEqual(
      ignitor.application.container.use('Adonis/Core/Server'),
      ignitor.application.container.use('Adonis/Core/Server'),
    )

    assert.deepEqual(
      ignitor.application.container.use('Adonis/Core/MiddlewareStore'),
      ignitor.application.container.use('Adonis/Core/MiddlewareStore'),
    )

    const config = ignitor.application.container.use('Adonis/Core/Config')
    const env = ignitor.application.container.use('Adonis/Core/Env')

    assert.equal(config.get('app.appKey'), SECRET)
    assert.equal(env.get('APP_KEY'), SECRET)
  })
})

test.group('Ignitor | Preloads', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('on boot load preload files', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`start/route.ts`, `
      const Config = global[Symbol.for('ioc.use')]('Adonis/Core/Config')
      Config.set('routeLoaded', true)
    `)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [{
        file: 'start/route',
      }],
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    const config = ignitor.application.container.use('Adonis/Core/Config')
    assert.isTrue(config.get('routeLoaded'))
  })

  test('ignore preload files defined for a different environment', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`start/route.ts`, `
      const Config = global[Symbol.for('ioc.use')]('Adonis/Core/Config')
      Config.set('routeLoaded', true)
    `)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'start/route',
          environment: ['web'],
        },
        {
          file: 'start/kernel',
          environment: ['console'],
        },
      ],
    }))

    const ignitor = new Ignitor(fs.basePath)
    ignitor.application.environment = 'web'
    await ignitor.bootstrap()

    const config = ignitor.application.container.use('Adonis/Core/Config')
    assert.isTrue(config.get('routeLoaded'))
  })

  test('raise error when preload file is missing', async (assert) => {
    assert.plan(1)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`start/route.ts`, '')
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'start/route',
          environment: ['web'],
        },
        {
          file: 'start/kernel',
          environment: ['web'],
        },
      ],
    }))

    const ignitor = new Ignitor(fs.basePath)

    try {
      await ignitor.bootstrap()
    } catch ({ message }) {
      assert.match(message, new RegExp(`Cannot find module '${join(fs.basePath, 'start/kernel')}'`))
    }
  })

  test('ignore missing preload files when marked as optional', async () => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`start/route.ts`, '')
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'start/route',
          environment: ['web'],
        },
        {
          file: 'start/kernel',
          environment: ['web'],
          optional: true,
        },
      ],
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()
  })
})

test.group('Ignitor | Autoloads', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('define autoload aliases with ioc container', async (assert) => {
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

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.bootstrap()

    assert.deepEqual(ignitor.application.container.autoloads, { App: join(fs.basePath, 'app') })
  })
})

test.group('Ignitor | App Provider', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
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

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('call httpServerHooks when http server is created', async (assert) => {
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

    await fs.add('app/Exceptions/Handler.ts', `
      export default class Handler {
        async handle (error) {
          return \`handled \${error.message}\`
        }

        report () {
        }
      }
    `)

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

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)
    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

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
    server.instance.close()

    const { text } = await supertest(server.instance).get('/').expect(404)
    assert.equal(text, 'handled Cannot GET:/')
  })
})

test.group('Ignitor | Ace', (group) => {
  group.after(async () => {
    await fs.cleanup()
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('do not bootstrap application when running ace command', async (assert) => {
    const ignitor = new Ignitor(fs.basePath)
    await fs.add('ace-manifest.json', JSON.stringify({
      foo: {
        commandName: 'foo',
        commandPath: 'foo.ts',
      },
    }))

    await fs.add('foo.ts', `export default class Foo {
      public static args = []
      public static flags = []

      public static boot () {
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
        commandPath: 'foo.ts',
        settings: {
          loadApp: true,
        },
      },
    }))

    await fs.add('foo.ts', `export default class Foo {
      public static args = []
      public static flags = []

      public static boot () {
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
    const ignitor = new Ignitor(fs.basePath)

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

    await fs.add('providers/AppProvider.ts', `
      import { join } from 'path'

      export default class AppProvider {
        public commands = [join(__dirname, '..', 'commands', 'Foo.ts')]
      }
    `)

    await fs.add('commands/Foo.ts', `
      export default class Foo {
        public static commandName = 'foo'
        public static description = 'Print foo'

        public static args = []
        public static flags = []

        public static boot () {
        }

        public handle () {
        }
      }
    `)

    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}',
      '${join(fs.basePath, 'providers/AppProvider.ts')}',
    ]`)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await ignitor.handleAceCommand(['generate:manifest'])
    assert.isTrue(ignitor.bootstraped)

    const manifestFile = await fs.get('ace-manifest.json')
    assert.deepEqual(JSON.parse(manifestFile), {
      foo: {
        settings: {},
        commandPath: join(fs.basePath, 'commands/Foo'),
        commandName: 'foo',
        description: 'Print foo',
        args: [],
        flags: [],
      },
    })
  })

  test('load commands from start/app file', async (assert) => {
    const ignitor = new Ignitor(fs.basePath)

    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

    await fs.add('commands/Foo.ts', `
      export default class Foo {
        public static commandName = 'foo'
        public static description = 'Print foo'

        public static args = []
        public static flags = []

        public static boot () {
        }

        public handle () {
        }
      }
    `)

    await fs.add(`start/app.ts`, `
      import { join } from 'path'

      export const providers = [
        '${join(__dirname, '../providers/AppProvider.ts')}',
      ]

      export const commands = [
        join(__dirname, '..', 'commands', 'Foo.ts')
      ]
    `)

    await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)

    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    await ignitor.handleAceCommand(['generate:manifest'])
    assert.isTrue(ignitor.bootstraped)

    const manifestFile = await fs.get('ace-manifest.json')
    assert.deepEqual(JSON.parse(manifestFile), {
      foo: {
        settings: {},
        commandPath: join(fs.basePath, 'commands/Foo'),
        commandName: 'foo',
        description: 'Print foo',
        args: [],
        flags: [],
      },
    })
  })
})
