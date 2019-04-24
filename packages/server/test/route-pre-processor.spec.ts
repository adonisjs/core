/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Router } from '@adonisjs/router'
import { Ioc } from '@adonisjs/fold'

import { MiddlewareStore } from '../src/MiddlewareStore'
import { routePreProcessor } from '../src/routePreProcessor'

test.group('Route pre processor', (group) => {
  group.afterEach(() => {
    delete global['use']
    delete global['make']
  })

  test('process route by resolving function based middleware', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    async function middlewareFn () {}

    const route = router.get('/', function handler () {}).middleware([middlewareFn]).toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedMiddleware, [{
      type: 'function',
      value: middlewareFn,
      args: [],
    }])
  })

  test('process route by resolving named middleware', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    async function middlewareFn () {}
    middlewareStore.registerNamed({ auth: middlewareFn })

    const route = router.get('/', function handler () {}).middleware(['auth:jwt']).toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedMiddleware, [{
      type: 'function',
      value: middlewareFn,
      args: ['jwt'],
    }])
  })

  test('process route by resolving IoC bindings', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    class Auth {
      public async handle () {}
    }

    const ioc = new Ioc()
    ioc.bind('App/Middleware/Auth', () => Auth)
    global['use'] = ioc.use.bind(ioc)

    middlewareStore.registerNamed({ auth: 'App/Middleware/Auth' })

    const route = router.get('/', function handler () {}).middleware(['auth:jwt']).toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedMiddleware, [{
      type: 'class',
      value: Auth,
      args: ['jwt'],
    }])
  })

  test('resolve function based route handler', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    function handler () {}

    const route = router.get('/', handler).toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedHandler, {
      type: 'function',
      value: handler,
    })
  })

  test('resolve ioc container binding for route handler', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    class UserController {
      public async store () {}
    }

    const ioc = new Ioc()
    ioc.bind('App/Controllers/Http/UserController', () => UserController)
    global['use'] = ioc.use.bind(ioc)

    const route = router.get('/', 'UserController.store').toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedHandler, {
      type: 'class',
      value: 'App/Controllers/Http/UserController',
      method: 'store',
    })
  })

  test('do not prepend namespace when is absolute namespace', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    class UserController {
      public async store () {}
    }

    const ioc = new Ioc()
    ioc.bind('UserController', () => UserController)
    global['use'] = ioc.use.bind(ioc)

    const route = router.get('/', '/UserController.store').toJSON()
    routePreProcessor(route, middlewareStore)

    assert.deepEqual(route.meta.resolvedHandler, {
      type: 'class',
      value: 'UserController',
      method: 'store',
    })
  })

  test('raise error when method is missing in controller binding', (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    class UserController {
      public async store () {}
    }

    const ioc = new Ioc()
    ioc.bind('UserController', () => UserController)
    global['use'] = ioc.use.bind(ioc)

    const route = router.get('/', '/UserController').toJSON()
    const fn = () => routePreProcessor(route, middlewareStore)

    assert.throw(fn, 'Missing controller method on `/` route')
  })

  test('raise error when controller method is missing', (_assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router()

    class UserController {
    }

    const ioc = new Ioc()
    ioc.bind('App/Controllers/Http/UserController', () => UserController)
    global['use'] = ioc.use.bind(ioc)

    const route = router.get('/', '/UserController.store').toJSON()
    routePreProcessor(route, middlewareStore)

    console.log(route.meta.finalHandler)
  })
})
