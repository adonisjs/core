/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import getPort from 'get-port'
import supertest from 'supertest'
import { test } from '@japa/runner'
import { createServer } from 'node:http'

import type { ApplicationService } from '../../src/types.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Ignitor | Http server process', () => {
  test('start http server using the http server process', async ({ assert, cleanup }) => {
    cleanup(async () => {
      delete process.env.HOST
      delete process.env.PORT
      await ignitor.terminate()
    })

    process.env.HOST = 'localhost'
    process.env.PORT = String(await getPort())
    const serverURL = `http://${process.env.HOST}:${process.env.PORT}`

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .preload(async (app) => {
        const router = await app.container.make('router')
        router.get('/', () => {
          return 'hello world'
        })
      })
      .create(BASE_URL)

    await ignitor.httpServer().start()

    const { text } = await supertest(serverURL).get('/')
    assert.equal(text, 'hello world')
  })

  test('use port 3333 when PORT env variable is not defined', async ({ assert, cleanup }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const serverURL = 'http://127.0.0.1:3333'

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .preload(async (app) => {
        const router = await app.container.make('router')
        router.get('/', () => {
          return 'hello world'
        })
      })
      .create(BASE_URL)

    await ignitor.httpServer().start()

    const { text } = await supertest(serverURL).get('/')
    assert.equal(text, 'hello world')
  })

  test('shutdown server when app terminates', async ({ assert, cleanup }) => {
    let app: ApplicationService

    cleanup(async () => {
      delete process.env.HOST
      delete process.env.PORT
    })

    process.env.HOST = 'localhost'
    process.env.PORT = String(await getPort())

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    ignitor.tap((application) => {
      app = application
    })

    await ignitor.httpServer().start()
    const server = await app!.container.make('server')
    assert.isTrue(server.getNodeServer()!.listening)

    await ignitor.terminate()
    assert.isFalse(server.getNodeServer()!.listening)
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
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    await new Promise<void>((resolve) => {
      nodeServer.listen(Number(process.env.PORT), process.env.HOST, () => {
        resolve()
      })
    })

    await assert.rejects(
      () => ignitor.httpServer().start(),
      /listen EADDRINUSE: address already in use/
    )
  })

  test('terminate app if server crashes after starting', async ({ cleanup, assert }, done) => {
    let app: ApplicationService
    cleanup(async () => {
      process.exitCode = undefined
      delete process.env.HOST
      delete process.env.PORT
    })

    process.env.HOST = 'localhost'
    process.env.PORT = String(await getPort())

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    ignitor.tap((application) => {
      app = application
    })

    await ignitor.httpServer().start()
    app!.terminating(() => {
      done()
    })

    const server = await app!.container.make('server')
    server.getNodeServer()!.emit('error', new Error('crash'))
    assert.equal(process.exitCode, 1)
  }).waitForDone()
})
