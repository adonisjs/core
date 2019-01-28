/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Ioc } from '@adonisjs/fold'
import { Router } from '@adonisjs/router'

import { MiddlewareStore } from '../src/MiddlewareStore'

test.group('Middleware', () => {
  test('register global middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.register([handler])
    assert.deepEqual(middleware.get(), [{
      type: 'function',
      value: handler,
      args: [],
    }])
  })

  test('register named middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.registerNamed({ auth: handler })
    assert.deepEqual(middleware['_named'], {
      auth: { type: 'function', value: handler, args: [] },
    })
  })

  test('get named middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.registerNamed({ auth: handler })
    assert.deepEqual(middleware.getNamed('auth'), {
      type: 'function', value: handler, args: [],
    })
  })

  test('return null when middleware doesn\'t exists', (assert) => {
    const middleware = new MiddlewareStore()
    assert.isNull(middleware.getNamed('auth'))
  })

  test('middleware executor execute resolved function middleware', async (assert) => {
    const stack: any[] = []
    async function middlewareFn () {
      stack.push('middlewareFn')
    }

    const middleware = new MiddlewareStore()
    middleware.register([middlewareFn])
    await middleware.middlewareExecutor(middleware.get()[0], [])

    assert.deepEqual(stack, ['middlewareFn'])
  })

  test('middleware executor execute resolved class middleware', async (assert) => {
    const stack: any[] = []

    class Middleware {
      public async handle () {
        stack.push('middleware class')
      }
    }

    const ioc = new Ioc()
    ioc.bind('App/Middleware', () => Middleware)
    global['use'] = ioc.use.bind(ioc)
    global['make'] = ioc.make.bind(ioc)

    const middleware = new MiddlewareStore()
    middleware.register(['App/Middleware'])
    await middleware.middlewareExecutor(middleware.get()[0], [])

    assert.deepEqual(stack, ['middleware class'])

    delete global['use']
    delete global['make']
  })

  test('process route middleware using the store', async (assert) => {
    async function handler () {}
    const middleware = new MiddlewareStore()
    middleware.registerNamed({ auth: handler })

    const router = new Router(middleware.routeMiddlewareProcessor.bind(middleware))

    router.get('/', () => {}).middleware('auth')
    router.commit()

    assert.deepEqual(router['_store'].tree.domains.root['GET'].routes['/'].meta, {
      resolvedMiddleware: [{
        type: 'function',
        value: handler,
        args: [],
      }],
    })
  })

  test('parse runtime route middleware args', async (assert) => {
    async function handler () {}
    const middleware = new MiddlewareStore()
    middleware.registerNamed({ auth: handler })

    const router = new Router(middleware.routeMiddlewareProcessor.bind(middleware))

    router.get('/', () => {}).middleware('auth:basic,jwt')
    router.commit()

    assert.deepEqual(router['_store'].tree.domains.root['GET'].routes['/'].meta, {
      resolvedMiddleware: [{
        type: 'function',
        value: handler,
        args: ['basic', 'jwt'],
      }],
    })
  })

  test('pass runtime route middleware args to route handler', async (assert) => {
    let args = []
    async function handler (_args) {
      args = _args
    }

    const middleware = new MiddlewareStore()
    middleware.registerNamed({ auth: handler })

    const router = new Router(middleware.routeMiddlewareProcessor.bind(middleware))
    router.get('/', () => {}).middleware('auth:basic,jwt')
    router.commit()

    await middleware.middlewareExecutor(
      router['_store'].tree.domains.root['GET'].routes['/'].meta.resolvedMiddleware[0],
      [],
    )

    assert.deepEqual(args, ['basic', 'jwt'])
  })

  test('raise error when unable to find named middleware', async (assert) => {
    const middleware = new MiddlewareStore()

    const router = new Router(middleware.routeMiddlewareProcessor.bind(middleware))
    router.get('/', () => {}).middleware('auth:basic,jwt')

    const fn = () => router.commit()
    assert.throw(fn, 'E_MISSING_NAMED_MIDDLEWARE: Cannot find named middleware auth')
  })

  test('raise error when middleware type is not from pre-defined one\'s', async (assert) => {
    const middleware = new MiddlewareStore()
    assert.plan(1)

    try {
      await middleware.middlewareExecutor({
        type: 'foo',
        value: async () => {},
        args: [],
      }, [])
    } catch ({ message }) {
      assert.equal(message, 'E_INVALID_MIDDLEWARE_TYPE: foo is not a valid middleware type')
    }
  })

  test('define middleware as inline function', async (assert) => {
    async function handler () {}
    const middleware = new MiddlewareStore()

    const router = new Router(middleware.routeMiddlewareProcessor.bind(middleware))

    router.get('/', () => {}).middleware(handler)
    router.commit()

    assert.deepEqual(router['_store'].tree.domains.root['GET'].routes['/'].meta, {
      resolvedMiddleware: [{
        type: 'function',
        value: handler,
        args: [],
      }],
    })
  })
})
