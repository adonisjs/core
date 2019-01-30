/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { createServer } from 'http'
import { Request } from '@adonisjs/request'
import { Response } from '@adonisjs/response'
import { Router } from '@adonisjs/router'
import { Ioc } from '@adonisjs/fold'

import { MiddlewareStore } from '../src/MiddlewareStore'
import { Server } from '../src/Server'
import { routePreProcessor } from '../src/routePreProcessor'

test.group('Server | Response handling', () => {
  test('invoke router handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', ({ response }) => response.send('handled'))
    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('use route handler return value when response.send is not called', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => 'handled')
    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('do not use return value when response.send is called', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', ({ response }) => {
      response.send('handled')
      return 'done'
    })
    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('do not use return value when explicit mode is set to false', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', ({ response }) => {
      response.explicitEnd = false

      setTimeout(() => {
        response.send('handled')
      }, 0)

      return 'done'
    })
    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })
})

test.group('Server | middleware', () => {
  test('execute global middleware before route handler', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    })
    router.commit()

    await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'handler'])
  })

  test('execute global and route middleware before route handler', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()

    await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'route fn1', 'handler'])
  })

  test('terminate request from global middleware', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx) {
        stack.push('fn1')
        _ctx.response.send('completed')
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1'])
    assert.equal(text, 'completed')
  })

  test('terminate request from global middleware with exception', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 () {
        stack.push('fn1')
        throw new Error('Cannot process')
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.deepEqual(stack, ['fn1'])
    assert.equal(text, 'Cannot process')
  })

  test('terminate request from named middleware with exception', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware () {
      throw new Error('Short circuit')
    })

    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.deepEqual(stack, ['fn1', 'fn2'])
    assert.equal(text, 'Short circuit')
  })

  test('terminate request from named middleware by not calling next', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx) {
      stack.push('route fn1')
      _ctx.response.send('Short circuit')
    })

    router.commit()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'route fn1'])
    assert.equal(text, 'Short circuit')
  })
})

test.group('Server | all', (group) => {
  group.afterEach(() => {
    delete global['use']
    delete global['make']
  })

  test('raise 404 when route is missing', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    router.commit()

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(404)
    assert.equal(text, 'E_ROUTE_NOT_FOUND: Cannot GET:/')
  })

  test('execute IoC container controller binding', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    class HomeController {
      public async index () {
        return 'handled'
      }
    }

    const ioc = new Ioc()
    ioc.bind('App/Controllers/Http/HomeController', () => new HomeController())
    global['make'] = ioc.make.bind(ioc)

    router.get('/', 'HomeController.index')
    router.commit()

    const server = new Server(Request, Response, router, middlewareStore, {})
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })
})
