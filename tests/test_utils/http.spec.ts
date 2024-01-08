/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import getPort from 'get-port'
import { Socket } from 'node:net'
import { test } from '@japa/runner'
import { createServer, IncomingMessage, ServerResponse } from 'node:http'

import { HttpContext } from '../../modules/http/main.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'
import { TestUtilsFactory } from '../../factories/core/test_utils.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Test utils | Http', () => {
  test('start HTTP server using test utils', async ({ assert, cleanup }) => {
    const server = createServer()
    cleanup(() => {
      server.close()
    })

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)
  })

  test('close HTTP server using the cleanup function', async ({ assert, cleanup }) => {
    const server = createServer()
    cleanup(() => {
      server.close()
    })

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const closeServer = await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)

    await closeServer()
    assert.isFalse(server.listening)
  })

  test('share HTTP server instance with AdonisJS server class', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const closeServer = await testUtils.httpServer().start()
    const adonisJsServer = await testUtils.app.container.make('server')
    assert.isTrue(adonisJsServer.getNodeServer()!.listening)

    await closeServer()
    assert.isFalse(adonisJsServer.getNodeServer()!.listening)
  })

  test('throw error if port is already in use', async ({ assert, cleanup }) => {
    const nodeServer = createServer(() => {})

    cleanup(async () => {
      delete process.env.HOST
      delete process.env.PORT
      nodeServer.close()
    })

    process.env.HOST = 'localhost'
    process.env.PORT = String(await getPort())

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    await new Promise<void>((resolve) => {
      nodeServer.listen(Number(process.env.PORT), process.env.HOST, () => {
        resolve()
      })
    })

    await assert.rejects(async () => {
      await testUtils.httpServer().start()
    }, /listen EADDRINUSE: address already in use/)
  })

  test('raise error when closing an already closed server', async ({ assert, cleanup }) => {
    const server = createServer()
    cleanup(() => {
      server.close()
    })

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const closeServer = await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)

    await closeServer()
    await assert.rejects(() => closeServer(), 'Server is not running.')
  })

  test('create HTTP context', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const context = await testUtils.createHttpContext()
    assert.instanceOf(context, HttpContext)
  })

  test('create HTTP context with custom req and res object', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const req = new IncomingMessage(new Socket())
    const res = new ServerResponse(req)

    req.url = '/users/1'

    const context = await testUtils.createHttpContext({ req, res })
    assert.instanceOf(context, HttpContext)
    assert.equal(context.request.url(), '/users/1')
  })
})
