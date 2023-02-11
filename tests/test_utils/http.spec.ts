/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import getPort from 'get-port'
import { test } from '@japa/runner'
import { createServer } from 'node:http'
import { TestUtilsFactory } from '../../test_factories/test_utils.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Test utils | Http', () => {
  test('start HTTP server using test utils', async ({ assert, cleanup }) => {
    const server = createServer()
    cleanup(() => server.close())

    const testUtils = new TestUtilsFactory().create(BASE_URL, {
      importer: (filePath) => import(filePath),
    })
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)
  })

  test('close HTTP server using the cleanup function', async ({ assert, cleanup }) => {
    const server = createServer()
    cleanup(() => server.close())

    const testUtils = new TestUtilsFactory().create(BASE_URL, {
      importer: (filePath) => import(filePath),
    })
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const closeServer = await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)

    await closeServer()
    assert.isFalse(server.listening)
  })

  test('share HTTP server instance with AdonisJS server class', async ({ assert }) => {
    const testUtils = new TestUtilsFactory().create(BASE_URL, {
      importer: (filePath) => import(filePath),
    })
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

    const testUtils = new TestUtilsFactory().create(BASE_URL, {
      importer: (filePath) => import(filePath),
    })
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
    cleanup(() => server.close())

    const testUtils = new TestUtilsFactory().create(BASE_URL, {
      importer: (filePath) => import(filePath),
    })
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const closeServer = await testUtils.httpServer().start(() => server)
    assert.isTrue(server.listening)

    await closeServer()
    await assert.rejects(() => closeServer(), 'Server is not running.')
  })
})
