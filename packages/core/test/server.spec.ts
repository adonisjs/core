/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { Router } from '@adonisjs/router'
import { createServer } from 'http'

import { Server } from '../src/Server'

test.group('Server', () => {
  test('execute registered route for a given request', async (assert) => {
    const router = new Router()
    router.get('/', ({ response }) => response.send('handled'))
    router.commit()

    const server = new Server(router)
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('raise 404 when route is missing', async (assert) => {
    const router = new Router()
    router.commit()

    const server = new Server(router)
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(404)
    assert.equal(text, 'Cannot GET:/')
  })

  test('execute global middleware before the route handler', async (assert) => {
    const stack: string[] = []

    const router = new Router()
    router.get('/', ({ response }) => {
      stack.push('route')
      response.send('done')
    })
    router.commit()

    const server = new Server(router)
    server.globalMiddleware([
      async function fn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
    ])

    const httpServer = createServer(server.handle.bind(server))
    await supertest(httpServer).get('/').expect(200)

    assert.deepEqual(stack, ['fn1', 'route'])
  })

  test('do not execute middleware when no route is found', async (assert) => {
    const stack: string[] = []

    const router = new Router()
    router.commit()

    const server = new Server(router)
    server.globalMiddleware([
      async function fn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
    ])

    const httpServer = createServer(server.handle.bind(server))
    await supertest(httpServer).get('/').expect(404)

    assert.deepEqual(stack, [])
  })

  test.skipInCI('do not execute handler when next is not called by the middleware', async (assert) => {
    const stack: string[] = []

    const router = new Router()
    router.get('/', ({ response }) => {
      stack.push('route')
      response.send('done')
    })
    router.commit()

    const server = new Server(router)
    server.globalMiddleware([
      async function fn1 ({ response }) {
        stack.push('fn1')
        response.send('done by middleware')
      },
    ])

    const httpServer = createServer(server.handle.bind(server))
    const { text } = await supertest(httpServer).get('/').expect(200)

    assert.deepEqual(stack, ['fn1'])
    assert.equal(text, 'done by middleware')
  })
})
