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
import { setupApplicationFiles } from '../test-helpers'

const fs = new Filesystem(join(__dirname, '__app'))

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
    await fs.add('providers/AppProvider.ts', `
    export default class AppProvider {
      constructor (protected $container) {}

      public async ready () {
        this.$container.use('Adonis/Core/Server').hookCalled = true
      }
    }
    `)

    await setupApplicationFiles(fs, ['./providers/AppProvider'])

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const server = httpServer.application.container.use('Adonis/Core/Server')
    await server.instance.close()
    assert.isTrue(server.hookCalled)
  })

  test('start http server to accept incoming requests', async (assert, done) => {
    await setupApplicationFiles(fs)

    const ignitor = new Ignitor(fs.basePath)
    const boostrapper = ignitor.boostrapper()
    const httpServer = ignitor.httpServer()
    const application = boostrapper.setup()

    boostrapper.registerAutoloads()
    boostrapper.registerProviders(false)
    await boostrapper.bootProviders()

    const server = application.container.use('Adonis/Core/Server')
    application.container.use('Adonis/Core/Route').get('/', () => 'handled')
    httpServer.injectBootstrapper(boostrapper)

    await httpServer.start((handler) => createServer(handler))
    assert.isTrue(httpServer.application.isReady)

    const { text } = await supertest(server.instance).get('/').expect(200)
    server.instance.close()

    setTimeout(() => {
      assert.isFalse(application.isReady)
      assert.equal(text, 'handled')
      done()
    }, 100)
  })

  test('forward errors to app error handler', async (assert) => {
    await setupApplicationFiles(fs)

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
    const httpServer = ignitor.httpServer()

    await httpServer.start((handler) => createServer(handler))
    const server = httpServer.application.container.use('Adonis/Core/Server')

    const { text } = await supertest(server.instance).get('/').expect(404)
    server.instance.close()
    assert.equal(text, 'handled Cannot GET:/')
  })

  test('kill app when server receives error', async (assert) => {
    assert.plan(1)

    await setupApplicationFiles(fs)

    const ignitor = new Ignitor(fs.basePath)
    const httpServer = ignitor.httpServer()

    httpServer.kill = async function kill () {
      assert.isTrue(true)
      server.instance.close()
    }

    await httpServer.start((handler) => createServer(handler))
    const server = httpServer.application.container.use('Adonis/Core/Server')
    server.instance.emit('error', new Error())
  })

  test('close http server gracefully when closing the app', async (assert, done) => {
    assert.plan(2)
    await setupApplicationFiles(fs)

    const ignitor = new Ignitor(fs.basePath)
    const httpServer = ignitor.httpServer()

    await httpServer.start((handler) => createServer(handler))
    const server = httpServer.application.container.use('Adonis/Core/Server')

    server.instance.on('close', () => {
      assert.isTrue(true)
      assert.isFalse(httpServer.application.isReady)
      done()
    })

    await httpServer.close()
  })

  test('invoke shutdown method when gracefully closing the app', async (assert) => {
    await fs.add('providers/AppProvider.ts', `
    export default class AppProvider {
      constructor (protected $container) {}

      public async shutdown () {
        this.$container.use('Adonis/Core/Server').hookCalled = true
      }
    }
    `)

    await setupApplicationFiles(fs, ['./providers/AppProvider'])

    const ignitor = new Ignitor(fs.basePath)
    const httpServer = ignitor.httpServer()

    await httpServer.start((handler) => createServer(handler))
    const server = httpServer.application.container.use('Adonis/Core/Server')

    await httpServer.close()
    assert.isTrue(server.hookCalled)
  })
})
