'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Route = require('../../src/Route')
const RouteGroup = require('../../src/Route/Group')
const RouteResource = require('../../src/Route/Resource')
const RouteStore = require('../../src/Route/Store')
const RouteManager = require('../../src/Route/Manager')

test.group('Route | Register', () => {
  test('throw exception when url is not defined', (assert) => {
    const route = () => new Route()
    assert.throw(route, 'E_INVALID_PARAMETER: Cannot instantiate route without a valid url string')
  })

  test('throw exception when url is not string', (assert) => {
    const route = () => new Route(22)
    assert.throw(route, 'E_INVALID_PARAMETER: Cannot instantiate route without a valid url string instead received number')
  })

  test('throw exception when route handler is not defined', (assert) => {
    const route = () => new Route('/')
    assert.throw(route, 'E_INVALID_PARAMETER: Cannot instantiate route without route handler')
  })

  test('throw exception when route handler is not a function or string', (assert) => {
    const route = () => new Route('/', true)
    assert.throw(route, 'E_INVALID_PARAMETER: Cannot instantiate route without route handler instead received boolean')
  })

  test('define a simple route', (assert) => {
    const route = new Route('/', function () {})
    assert.equal(route._route, '/')
    assert.deepEqual(route._verbs, ['HEAD', 'GET'])
    assert.deepEqual(route._name, '/')
    assert.deepEqual(route._middleware, [])
  })

  test('define route middleware', (assert) => {
    const route = new Route('/', function () {})
    const middlewareFn = function () {}
    route.middleware(middlewareFn)
    assert.deepEqual(route._middleware, [middlewareFn])
  })

  test('define route middleware as an array', (assert) => {
    const route = new Route('/', function () {})
    const middlewareFn = function () {}
    route.middleware([middlewareFn])
    assert.deepEqual(route._middleware, [middlewareFn])
  })

  test('add middleware multiple times', (assert) => {
    const route = new Route('/', function () {})
    const middlewareFn = function () {}
    route
      .middleware([middlewareFn])
      .middleware([middlewareFn])
    assert.deepEqual(route._middleware, [middlewareFn, middlewareFn])
  })

  test('prepend middleware', (assert) => {
    const route = new Route('/', function () {})
    const middlewareFn = function () {}
    const middlewareFn1 = function () {}
    route
      .middleware([middlewareFn])
      .prependMiddleware([middlewareFn1])
    assert.deepEqual(route._middleware, [middlewareFn1, middlewareFn])
  })

  test('give name to a route', (assert) => {
    const route = new Route('/', function () {})
    route.as('foo')
    assert.equal(route._name, 'foo')
  })

  test('give formats to the route', (assert) => {
    const route = new Route('/users', function () {})
    route.formats(['json', 'html'])
    assert.equal(route._regexp.exec('/users')[0], '/users')
    assert.equal(route._regexp.exec('/users.json')[1], '.json')
    assert.equal(route._regexp.exec('/users.html')[1], '.html')
  })

  test('restrict route to only formats', (assert) => {
    const route = new Route('/users', function () {})
    route.formats(['json', 'html'], true)
    assert.equal(route._regexp.exec('/users'), null)
    assert.equal(route._regexp.exec('/users.html')[1], '.html')
  })

  test('prefix route', (assert) => {
    const route = new Route('/users', function () {})
    route.prefix('/api/v1')
    assert.equal(route._route, '/api/v1/users')
    assert.equal(route._regexp.exec('/users'), null)
    assert.equal(route._regexp.exec('/api/v1/users')[0], '/api/v1/users')
  })

  test('prefix route when there is extra backward slash', (assert) => {
    const route = new Route('/users', function () {})
    route.prefix('/api/v1/')
    assert.equal(route._route, '/api/v1/users')
    assert.equal(route._regexp.exec('/users'), null)
    assert.equal(route._regexp.exec('/api/v1/users')[0], '/api/v1/users')
  })

  test('define domain', (assert) => {
    const route = new Route('/users', function () {})
    route.domain('blog.adonisjs.com')
    assert.ok(route._domain.test('blog.adonisjs.com'))
  })

  test('define dynamic domain', (assert) => {
    const route = new Route('/posts', function () {})
    route.domain(':user.adonisjs.com')
    assert.ok(route._domain.test('virk.adonisjs.com'))
  })

  test('add forward slash if missing', (assert) => {
    const route = new Route('users', function () {})
    route.formats(['json', 'html'])
    assert.equal(route._regexp.exec('/users')[0], '/users')
    assert.equal(route._regexp.exec('/users.json')[1], '.json')
    assert.equal(route._regexp.exec('/users.html')[1], '.html')
  })

  test('register proper regex when route is a *', (assert) => {
    const route = new Route('*', function () {})
    assert.equal(route._route, '/(.*)')
  })
})

test.group('Route | Resolve', () => {
  test('resolve registered route', (assert) => {
    const route = new Route('/', function () {})
    assert.deepEqual(route.resolve('/', 'GET'), { url: '/', params: {}, subdomains: {} })
  })

  test('return null when unable to resolve route', (assert) => {
    const route = new Route('/', function () {})
    assert.isNull(route.resolve('/foo', 'GET'))
  })

  test('resolve route with route params', (assert) => {
    const route = new Route('/make/:drink', function () {})
    assert.deepEqual(route.resolve('/make/coffee', 'GET'), { url: '/make/coffee', params: {drink: 'coffee'}, subdomains: {} })
  })

  test('resolve route with route optional params', (assert) => {
    const route = new Route('/make/:drink?', function () {})
    assert.deepEqual(route.resolve('/make/coffee', 'GET'), { url: '/make/coffee', params: {drink: 'coffee'}, subdomains: {} })
  })

  test('resolve route when optional param is missing', (assert) => {
    const route = new Route('/make/:drink?', function () {})
    assert.deepEqual(route.resolve('/make', 'GET'), { url: '/make', params: {drink: null}, subdomains: {} })
  })

  test('resolve route with zero or more dynamic params', (assert) => {
    const route = new Route('/coffee/:ingredients*', function () {})
    assert.deepEqual(
      route.resolve('/coffee/sugar/milk', 'GET'),
      { url: '/coffee/sugar/milk', params: {ingredients: ['sugar', 'milk']}, subdomains: {} }
    )
  })

  test('resolve route with one or more dynamic params', (assert) => {
    const route = new Route('/coffee/:ingredients+', function () {})
    assert.deepEqual(
      route.resolve('/coffee/sugar/milk', 'GET'),
      { url: '/coffee/sugar/milk', params: {ingredients: ['sugar', 'milk']}, subdomains: {} }
    )
  })

  test('return null dynamic param is missing', (assert) => {
    const route = new Route('/coffee/:ingredients+', function () {})
    assert.isNull(route.resolve('/coffee', 'GET'))
  })

  test('return null on verb mis-match', (assert) => {
    const route = new Route('/', function () {}, ['POST'])
    assert.isNull(route.resolve('/', 'GET'))
  })

  test('return null when host mistmatch', (assert) => {
    const route = new Route('/', function () {}, ['GET'])
    route.domain('adonisjs.com')
    assert.isNull(route.resolve('/', 'GET', 'blog.adonisjs.com'))
  })

  test('resolve route when host matches', (assert) => {
    const route = new Route('/', function () {}, ['GET'])
    route.domain('virk.adonisjs.com')
    assert.deepEqual(route.resolve('/', 'GET', 'virk.adonisjs.com'), { url: '/', params: {}, subdomains: {} })
  })

  test('resolve dynamic subdomains in route domain', (assert) => {
    const route = new Route('/posts', function () {})
    route.domain(':user.adonisjs.com')
    assert.deepEqual(route.resolve('/posts', 'GET', 'virk.adonisjs.com'), { url: '/posts', params: {}, subdomains: { user: 'virk' } })
  })

  test('return the route without process when route is /', (assert) => {
    const route = new Route('/', function () {}, ['GET'])
    route._regexp.exec = function () {
      throw new Error('Never expected to reach here')
    }
    assert.deepEqual(route.resolve('/', 'GET'), { url: '/', params: {}, subdomains: {} })
  })

  test('return the route without processing when url and route are same', (assert) => {
    const route = new Route('user', function () {}, ['GET'])
    route._regexp.exec = function () {
      throw new Error('Never expected to reach here')
    }
    assert.deepEqual(route.resolve('/user', 'GET'), { url: '/user', params: {}, subdomains: {} })
  })

  test('return JSON representation of the route', (assert) => {
    const fn = function () {}
    const route = new Route('/', fn, ['GET']).as('home')
    assert.deepEqual(route.toJSON(), {
      route: '/',
      name: 'home',
      handler: fn,
      middleware: [],
      verbs: ['GET'],
      domain: null
    })
  })
})

test.group('Route | Group', () => {
  test('group routes', (assert) => {
    const route = new Route('/', function () {})
    const group = new RouteGroup([route])
    assert.deepEqual(group._routes, [route])
  })

  test('add middleware to route via group', (assert) => {
    const route = new Route('/', function () {})
    const group = new RouteGroup([route])
    group.middleware(['foo'])
    assert.deepEqual(route._middleware, ['foo'])
  })

  test('add formats to route via group', (assert) => {
    const route = new Route('/', function () {})
    const userRoute = new Route('/user', function () {})
    const group = new RouteGroup([route, userRoute])
    group.formats(['json'], true)
    assert.ok(route._regexp.test('/.json'))
    assert.ok(userRoute._regexp.test('/user.json'))
  })

  test('prefix route via group', (assert) => {
    const route = new Route('/', function () {})
    const userRoute = new Route('/user', function () {})
    const group = new RouteGroup([route, userRoute])
    group.prefix('api')
    assert.ok(route._regexp.test('/api'))
    assert.ok(userRoute._regexp.test('/api/user'))
  })

  test('define domain via group', (assert) => {
    const route = new Route('/', function () {})
    const postsRoute = new Route('/posts', function () {})
    const group = new RouteGroup([route, postsRoute])
    group.domain('blog.adonisjs.com')
    assert.ok(route._domain.test('blog.adonisjs.com'))
    assert.ok(postsRoute._domain.test('blog.adonisjs.com'))
  })
})

test.group('Route | Resource', (group) => {
  group.beforeEach(() => {
    RouteStore.clear()
  })

  test('throw exception when resource name is not string', (assert) => {
    const resource = () => new RouteResource(22)
    assert.throw(resource, 'E_INVALID_PARAMETER: Route.resource expects name to be a string instead received number')
  })

  test('throw exception when resource controller is not string', (assert) => {
    const resource = () => new RouteResource('users', function () {})
    assert.throw(resource, 'E_INVALID_PARAMETER: Route.resource expects reference to a controller')
  })

  test('register simple resource', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    assert.equal(resource._resourceUrl, 'users')
  })

  test('register nested resource', (assert) => {
    const resource = new RouteResource('users.posts', 'PostsController')
    assert.equal(resource._resourceUrl, 'users/:users_id/posts')
  })

  test('trim extra slashes from resource name', (assert) => {
    const resource = new RouteResource('/users.posts/', 'PostsController')
    assert.equal(resource._resourceUrl, 'users/:users_id/posts')
  })

  test('add basic routes to the resource', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    const routesList = RouteStore.list()
    assert.lengthOf(resource._routes, 7)
    assert.lengthOf(routesList, 7)

    assert.deepEqual(routesList[0].toJSON(), {
      name: 'users.index',
      handler: 'UsersController.index',
      verbs: ['HEAD', 'GET'],
      route: '/users',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[1].toJSON(), {
      name: 'users.create',
      handler: 'UsersController.create',
      verbs: ['HEAD', 'GET'],
      route: '/users/create',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[2].toJSON(), {
      name: 'users.store',
      handler: 'UsersController.store',
      verbs: ['POST'],
      route: '/users',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[3].toJSON(), {
      name: 'users.show',
      handler: 'UsersController.show',
      verbs: ['HEAD', 'GET'],
      route: '/users/:id',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[4].toJSON(), {
      name: 'users.edit',
      handler: 'UsersController.edit',
      verbs: ['HEAD', 'GET'],
      route: '/users/:id/edit',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[5].toJSON(), {
      name: 'users.update',
      handler: 'UsersController.update',
      verbs: ['PUT', 'PATCH'],
      route: '/users/:id',
      middleware: [],
      domain: null
    })

    assert.deepEqual(routesList[6].toJSON(), {
      name: 'users.destroy',
      handler: 'UsersController.destroy',
      verbs: ['DELETE'],
      route: '/users/:id',
      middleware: [],
      domain: null
    })
  })

  test('prefix route names when a prefix name is provided', (assert) => {
    const resource = new RouteResource('users', 'UsersController', 'admin')
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(resource._routes, 7)
    assert.deepEqual(routeNames, [
      'admin.users.index',
      'admin.users.create',
      'admin.users.store',
      'admin.users.show',
      'admin.users.edit',
      'admin.users.update',
      'admin.users.destroy'
    ])
  })

  test('limit routes to certain names', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    resource.only(['create', 'show'])
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(routeNames, 2)
    assert.lengthOf(resource._routes, 2)
    assert.deepEqual(routeNames, ['users.create', 'users.show'])
  })

  test('limit prefixed named routes to certain names', (assert) => {
    const resource = new RouteResource('users', 'UsersController', 'admin')
    resource.only(['create', 'show'])
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(routeNames, 2)
    assert.lengthOf(resource._routes, 2)
    assert.deepEqual(routeNames, ['admin.users.create', 'admin.users.show'])
  })

  test('limit resource to apiOnly routes', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    resource.apiOnly()
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(routeNames, 5)
    assert.lengthOf(resource._routes, 5)
    assert.deepEqual(routeNames, ['users.index', 'users.store', 'users.show', 'users.update', 'users.destroy'])
  })

  test('remove routes for given names', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    resource.except(['create', 'show'])
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(routeNames, 5)
    assert.lengthOf(resource._routes, 5)
    assert.deepEqual(routeNames, ['users.index', 'users.store', 'users.edit', 'users.update', 'users.destroy'])
  })

  test('remove prefixed named routes for given names', (assert) => {
    const resource = new RouteResource('users', 'UsersController', 'admin')
    resource.except(['create', 'show'])
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.lengthOf(routeNames, 5)
    assert.lengthOf(resource._routes, 5)
    assert.deepEqual(routeNames, [
      'admin.users.index',
      'admin.users.store',
      'admin.users.edit',
      'admin.users.update',
      'admin.users.destroy'
    ])
  })

  test('add middleware', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(['foo'])
    RouteStore.list().forEach((route) => {
      assert.deepEqual(route._middleware, ['foo'])
    })
  })

  test('concat middleware when added multiple times', (assert) => {
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(['foo']).middleware(['bar']).middleware('baz')
    RouteStore.list().forEach((route) => {
      assert.deepEqual(route._middleware, ['foo', 'bar', 'baz'])
    })
  })

  test('define resource middleware via ES6 map', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(new Map([
      [['users.create', 'users.edit', 'users.update', 'users.destroy'], ['auth']]
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.create', 'users.edit', 'users.update', 'users.destroy'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth'])
      } else {
        assert.deepEqual(route._middleware, [])
      }
    })
  })

  test('define resource middleware via ES6 map where middleware is a string', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(new Map([
      [['users.create', 'users.edit', 'users.update', 'users.destroy'], 'auth']
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.create', 'users.edit', 'users.update', 'users.destroy'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth'])
      } else {
        assert.deepEqual(route._middleware, [])
      }
    })
  })

  test('define resource middleware via ES6 map where name is a string', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(new Map([
      ['users.destroy', ['auth']]
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.destroy'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth'])
      } else {
        assert.deepEqual(route._middleware, [])
      }
    })
  })

  test('define resource middleware via ES6 map where middleware and name are strings', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')
    resource.middleware(new Map([
      ['users.create', 'auth']
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.create'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth'])
      } else {
        assert.deepEqual(route._middleware, [])
      }
    })
  })

  test('define resource middleware via ES6 maps containing different middleware inside each row', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')

    resource.middleware(new Map([
      [['users.destroy'], ['auth', 'acl:superAdmin']],
      [['users.create', 'users.update'], ['auth', 'acl:admin']],
      [['users.index', 'users.show'], ['auth']]
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.destroy'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth', 'acl:superAdmin'])
      } else if (['users.create', 'users.update'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth', 'acl:admin'])
      } else if (['users.index', 'users.show'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth'])
      } else {
        assert.deepEqual(route._middleware, [])
      }
    })
  })

  test('define resource middleware via ES6 maps containing wildcard middleware and middlewares for routes', (assert) => {
    assert.plan(7)
    const resource = new RouteResource('users', 'UsersController')

    resource.middleware(new Map([
      ['users.destroy', ['role:admin']],
      ['*', ['auth']],
      [['users.store', 'users.destroy'], ['addonValidator:User']]
    ]))

    RouteStore.list().forEach((route) => {
      if (['users.store'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['auth', 'addonValidator:User'])
      } else if (['users.destroy'].indexOf(route._name) > -1) {
        assert.deepEqual(route._middleware, ['role:admin', 'auth', 'addonValidator:User'])
      } else {
        assert.deepEqual(route._middleware, ['auth'])
      }
    })
  })
})

test.group('Route | Manager', (group) => {
  group.beforeEach(() => {
    RouteStore.clear()
  })

  test('create a route with get verb', (assert) => {
    const route = RouteManager.get('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['HEAD', 'GET'])
  })

  test('create a route with post verb', (assert) => {
    const route = RouteManager.post('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['POST'])
  })

  test('create a route with put verb', (assert) => {
    const route = RouteManager.put('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['PUT'])
  })

  test('create a route with patch verb', (assert) => {
    const route = RouteManager.patch('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['PATCH'])
  })

  test('create a route with delete verb', (assert) => {
    const route = RouteManager.delete('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['DELETE'])
  })

  test('create a route for all verbs', (assert) => {
    const route = RouteManager.any('/', function () {})
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._verbs, ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  })

  test('create route with inbuilt handler to render a view', (assert) => {
    const route = RouteManager.on('/').render('welcome')
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.isFunction(route._handler)
  })

  test('define middleware on route renderer', (assert) => {
    const route = RouteManager.on('/').render('welcome').middleware('foo')
    assert.instanceOf(route, Route)
    assert.lengthOf(RouteStore.list(), 1)
    assert.deepEqual(route._middleware, ['foo'])
  })

  test('resolve a pre-define route', (assert) => {
    RouteManager.get('/user', function () {})
    const resolvedRoute = RouteManager.match('/user', 'GET')
    assert.instanceOf(resolvedRoute.route, Route)
    assert.deepEqual(resolvedRoute.params, {})
  })

  test('return null when unable to resolve a pre-define route', (assert) => {
    RouteManager.get('/user', function () {})
    const resolvedRoute = RouteManager.match('/foo', 'GET')
    assert.isNull(resolvedRoute)
  })

  test('define a group of routes', (assert) => {
    const group = RouteManager.group(function () {
      RouteManager.get('/', function () {})
    })
    assert.lengthOf(group._routes, 1)
    assert.equal(group._routes[0]._route, '/')
    assert.isFalse(RouteStore._breakpoint.enabled)
    assert.lengthOf(RouteStore._breakpoint.routes, 0)
  })

  test('group middleware should come after route middleware', (assert) => {
    RouteManager.group(function () {
      RouteManager.get('/', function () {}).middleware('bar')
    }).middleware('foo')
    assert.equal(RouteStore.list()[0]._middleware[0], 'foo')
    assert.equal(RouteStore.list()[0]._middleware[1], 'bar')
  })

  test('throw exception when nested groups are created', (assert) => {
    const fn = () => RouteManager.group(function () {
      RouteManager.group('/', function () {})
    }).middleware('foo')
    assert.throw(fn, 'E_NESTED_ROUTE_GROUPS: Nested route groups are not allowed')
  })

  test('define route resource', (assert) => {
    const resource = RouteManager.resource('users', 'UsersController')
    assert.instanceOf(resource, RouteResource)
    assert.lengthOf(RouteStore.list(), 7)
  })

  test('prefix resourceful routes when created inside a group', (assert) => {
    RouteManager.group('admin', () => {
      RouteManager.resource('users', 'UsersController')
    })
    assert.lengthOf(RouteStore.list(), 7)
    const routeNames = RouteStore.list().map((route) => route._name)
    assert.deepEqual(routeNames, [
      'admin.users.index',
      'admin.users.create',
      'admin.users.store',
      'admin.users.show',
      'admin.users.edit',
      'admin.users.update',
      'admin.users.destroy'
    ])
  })

  test('return list of routes', (assert) => {
    RouteManager.resource('users', 'UsersController')
    const routeNames = RouteManager.list().map((route) => route._name)
    assert.deepEqual(routeNames, [
      'users.index',
      'users.create',
      'users.store',
      'users.show',
      'users.edit',
      'users.update',
      'users.destroy'
    ])
  })

  test('make url for a registered route', (assert) => {
    RouteManager.get('users/:id', function () {})
    const url = RouteManager.url('/users/:id', { id: 1 })
    assert.equal(url, '/users/1')
  })

  test('make url for route name', (assert) => {
    RouteManager.get('users/:id', function () {}).as('profile')
    const url = RouteManager.url('profile', { id: 2 })
    assert.equal(url, '/users/2')
  })

  test('make url for route with domain', (assert) => {
    RouteManager.get('users/:id', function () {}).as('profile')
    RouteManager.get('author/:id', function () {}).domain('blog.example.com').as('profile')

    const url = RouteManager.url('profile', { id: 2 }, 'blog.example.com')
    assert.equal(url, '/author/2')
  })

  test('make url for route with dynamic domain', (assert) => {
    RouteManager.get('users/:id', function () {}).as('profile')
    RouteManager.get('author/:id', function () {}).domain('(.*).example.com').as('profile')

    const url = RouteManager.url('profile', { id: 2 }, 'virk.example.com')
    assert.equal(url, '/author/2')
  })

  test('make url controller action', (assert) => {
    RouteManager.get('users/:id', 'UsersController.show')
    const url = RouteManager.url('UsersController.show', { id: 1 })
    assert.equal(url, '/users/1')
  })

  test('make url with domain for controller action', (assert) => {
    RouteManager.get('users/:id', 'UsersController.show')
    RouteManager.get('author/:id', 'UsersController.show').domain('blog.example.com')
    const url = RouteManager.url('UsersController.show', { id: 1 }, 'blog.example.com')
    assert.equal(url, '/author/1')
  })

  test('return null when unable to resolve route', (assert) => {
    const url = RouteManager.url('UsersController.show', { id: 1 }, 'blog.example.com')
    assert.isNull(url)
  })
})

test.group('Route | Extend', (group) => {
  group.beforeEach(() => {
    RouteStore.clear()
  })

  test('add macro to route', (assert) => {
    RouteManager.Route.macro('bind', function (key, model) {
      this._bindings = this._bindings || []
      this._bindings.push({ key, model })
      return this
    })

    const route = RouteManager.get('/', () => {}).bind('id', 'App/Model/User')
    assert.deepEqual(route._bindings, [{ key: 'id', model: 'App/Model/User' }])
  })

  test('add macro to route group', (assert) => {
    RouteManager.Route.macro('bind', function (key, model) {
      this._bindings = this._bindings || []
      this._bindings.push({ key, model })
      return this
    })

    RouteManager.RouteGroup.macro('bind', function (key, model) {
      this._routes.forEach((route) => route.bind(key, model))
      return this
    })

    let route = null
    RouteManager.group(() => {
      route = RouteManager.get('/', () => {})
    }).bind('id', 'App/Model/User')
    assert.deepEqual(route._bindings, [{ key: 'id', model: 'App/Model/User' }])
  })

  test('add macro to route resource', (assert) => {
    RouteManager.Route.macro('bind', function (key, model) {
      this._bindings = this._bindings || []
      this._bindings.push({ key, model })
      return this
    })

    RouteManager.RouteResource.macro('bind', function (key, model) {
      this._routes.forEach((route) => {
        route.routeInstance.bind(key, model)
      })
      return this
    })

    RouteManager
      .resource('users', 'UsersController')
      .bind('id', 'App/Model/User')

    const route = RouteStore.list()[0]
    assert.deepEqual(route._bindings, [{ key: 'id', model: 'App/Model/User' }])
  })

  test('extend brisk route', (assert) => {
    const fn = function () {}
    RouteManager.BriskRoute.macro('redirect', function (toUrl) {
      return this.setHandler(fn)
    })
    const route = RouteManager.on('here').redirect('there')
    assert.equal(route._handler, fn)
  })
})
