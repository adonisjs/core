'use strict'

const test = require('japa')
const supertest = require('supertest')
const { ioc } = require('@adonisjs/fold')
const RouteStore = require('../../../src/Route/Store')
const appUrl = `http://${process.env.HOST}:${process.env.PORT}`

class UserController {
  index () {
    return 'all'
  }
  create () {
    return 'form'
  }
  store () {
    return 'stored'
  }
  show () {
    return 'one'
  }
  edit () {
    return 'one-form'
  }
  update () {
    return 'updated'
  }
  destroy () {
    return 'destroyed'
  }
}

test.group('Route', (group) => {
  group.after(() => {
    delete process.env.ENV_SILENT
  })

  group.beforeEach(() => {
    ioc.restore()
    RouteStore.clear()
  })

  test('root route should work fine', async (assert) => {
    const Route = use('Route')
    Route.get('/', async function () {
      return 'Hello world'
    })
    const res = await supertest(appUrl).get('/').expect(200)
    assert.equal(res.text, 'Hello world')
  })

  test('route without forward slash should work fine', async (assert) => {
    const Route = use('Route')
    const users = [{username: 'virk'}, {username: 'nikk'}]
    Route.get('user', async function () {
      return users
    })
    assert.deepEqual((await supertest(appUrl).get('/user').expect(200)).body, users)
  })

  test('route resources should return 200', async (assert) => {
    const Route = use('Route')

    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route.resource('users', 'UserController')

    assert.equal((await supertest(appUrl).get('/users').expect(200)).text, 'all')
    assert.equal((await supertest(appUrl).get('/users/create').expect(200)).text, 'form')
    assert.equal((await supertest(appUrl).post('/users').expect(200)).text, 'stored')
    assert.equal((await supertest(appUrl).get('/users/1').expect(200)).text, 'one')
    assert.equal((await supertest(appUrl).get('/users/1/edit').expect(200)).text, 'one-form')
    assert.equal((await supertest(appUrl).put('/users/1').expect(200)).text, 'updated')
    assert.equal((await supertest(appUrl).delete('/users/1').expect(200)).text, 'destroyed')
  })

  test('route resource with apiOnly do not register forms route', async (assert) => {
    const Route = use('Route')

    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route.resource('users', 'UserController').apiOnly()

    assert.equal((await supertest(appUrl).get('/users').expect(200)).text, 'all')
    assert.equal((await supertest(appUrl).get('/users/create').expect(200)).text, 'one')
    assert.equal((await supertest(appUrl).post('/users').expect(200)).text, 'stored')
    assert.equal((await supertest(appUrl).get('/users/1').expect(200)).text, 'one')
    await supertest(appUrl).get('/users/1/edit').expect(404)
    assert.equal((await supertest(appUrl).put('/users/1').expect(200)).text, 'updated')
    assert.equal((await supertest(appUrl).delete('/users/1').expect(200)).text, 'destroyed')
  })

  test('prefix routes inside a group', async (assert) => {
    const Route = use('Route')

    Route.group(function () {
      Route.get('/', function () {
        return 'api home'
      })

      Route.get('/about', function () {
        return 'api about'
      })
    }).prefix('api/v1')

    assert.equal((await supertest(appUrl).get('/api/v1').expect(200)).text, 'api home')
    assert.equal((await supertest(appUrl).get('/api/v1/about').expect(200)).text, 'api about')
  })

  test('prefix resource inside a group', async (assert) => {
    const Route = use('Route')
    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route.group(function () {
      Route.resource('users', 'UserController')
    }).prefix('api/v1')

    assert.equal((await supertest(appUrl).get('/api/v1/users').expect(200)).text, 'all')
    assert.equal((await supertest(appUrl).get('/api/v1/users/create').expect(200)).text, 'form')
    assert.equal((await supertest(appUrl).post('/api/v1/users').expect(200)).text, 'stored')
    assert.equal((await supertest(appUrl).get('/api/v1/users/1').expect(200)).text, 'one')
    assert.equal((await supertest(appUrl).get('/api/v1/users/1/edit').expect(200)).text, 'one-form')
    assert.equal((await supertest(appUrl).put('/api/v1/users/1').expect(200)).text, 'updated')
    assert.equal((await supertest(appUrl).delete('/api/v1/users/1').expect(200)).text, 'destroyed')
  })

  test('add formats to resource', async (assert) => {
    const Route = use('Route')
    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route.resource('users', 'UserController').formats(['json'], true)

    assert.equal((await supertest(appUrl).get('/users.json').expect(200)).text, 'all')
    assert.equal((await supertest(appUrl).get('/users/create.json').expect(200)).text, 'form')
    assert.equal((await supertest(appUrl).post('/users.json').expect(200)).text, 'stored')
    assert.equal((await supertest(appUrl).get('/users/1.json').expect(200)).text, 'one')
    assert.equal((await supertest(appUrl).get('/users/1/edit.json').expect(200)).text, 'one-form')
    assert.equal((await supertest(appUrl).put('/users/1.json').expect(200)).text, 'updated')
    assert.equal((await supertest(appUrl).delete('/users/1.json').expect(200)).text, 'destroyed')
  })

  test('add formats to group', async (assert) => {
    const Route = use('Route')
    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route.group(() => {
      Route.resource('users', 'UserController')
    }).formats(['json'], true)

    assert.equal((await supertest(appUrl).get('/users.json').expect(200)).text, 'all')
    assert.equal((await supertest(appUrl).get('/users/create.json').expect(200)).text, 'form')
    assert.equal((await supertest(appUrl).post('/users.json').expect(200)).text, 'stored')
    assert.equal((await supertest(appUrl).get('/users/1.json').expect(200)).text, 'one')
    assert.equal((await supertest(appUrl).get('/users/1/edit.json').expect(200)).text, 'one-form')
    assert.equal((await supertest(appUrl).put('/users/1.json').expect(200)).text, 'updated')
    assert.equal((await supertest(appUrl).delete('/users/1.json').expect(200)).text, 'destroyed')
  })

  test('add middleware to route', async (assert) => {
    const Route = use('Route')
    Route.get('/', function ({ request }) {
      return request.foo
    }).middleware(function ({ request }, next) {
      request.foo = 'bar'
      return next()
    })

    assert.equal((await supertest(appUrl).get('/').expect(200)).text, 'bar')
  })

  test('add middleware to group', async (assert) => {
    const Route = use('Route')
    Route.group(() => {
      Route.get('/', function ({ request }) {
        return request.foo
      })

      Route.get('/foo', function ({ request }) {
        return request.foo
      })
    }).middleware(function ({ request }, next) {
      request.foo = 'bar'
      return next()
    })

    assert.equal((await supertest(appUrl).get('/').expect(200)).text, 'bar')
    assert.equal((await supertest(appUrl).get('/foo').expect(200)).text, 'bar')
  })

  test('add middleware to resource', async (assert) => {
    const Route = use('Route')
    ioc.fake('App/Controllers/Http/UserController', function () {
      return new UserController()
    })

    Route
      .resource('users', 'UserController')
      .middleware([
        async ({ response }, next) => {
          await next()
          response._lazyBody.content = response._lazyBody.content + ' via middleware'
        }
      ])

    assert.equal((await supertest(appUrl).get('/users').expect(200)).text, 'all via middleware')
    assert.equal((await supertest(appUrl).get('/users/create').expect(200)).text, 'form via middleware')
    assert.equal((await supertest(appUrl).post('/users').expect(200)).text, 'stored via middleware')
    assert.equal((await supertest(appUrl).get('/users/1').expect(200)).text, 'one via middleware')
    assert.equal((await supertest(appUrl).get('/users/1/edit').expect(200)).text, 'one-form via middleware')
    assert.equal((await supertest(appUrl).put('/users/1').expect(200)).text, 'updated via middleware')
    assert.equal((await supertest(appUrl).delete('/users/1').expect(200)).text, 'destroyed via middleware')
  })

  test('render view with data via brisk route', async (assert) => {
    const Route = use('Route')
    Route.on('/').render('user', { name: 'virk' })
    assert.equal((await supertest(appUrl).get('/').expect(200)).text.trim(), 'Hello virk')
  })

  test('respond to all routes via *', async (assert) => {
    const Route = use('Route')
    Route.any('(.*)', ({ request }) => request.url())
    assert.equal((await supertest(appUrl).get('/users').expect(200)).text, '/users')
    assert.equal((await supertest(appUrl).get('/users/create').expect(200)).text, '/users/create')
    assert.equal((await supertest(appUrl).post('/users').expect(200)).text, '/users')
    assert.equal((await supertest(appUrl).get('/users/1').expect(200)).text, '/users/1')
    assert.equal((await supertest(appUrl).get('/users/1/edit').expect(200)).text, '/users/1/edit')
    assert.equal((await supertest(appUrl).put('/users/1').expect(200)).text, '/users/1')
    assert.equal((await supertest(appUrl).delete('/users/1').expect(200)).text, '/users/1')
  })

  test('get route format via request.format', async (assert) => {
    const Route = use('Route')
    Route.get('users', ({ request }) => request.format()).formats(['json', 'xml'])
    assert.equal((await supertest(appUrl).get('/users.json').expect(200)).text, 'json')
    assert.equal((await supertest(appUrl).get('/users.xml').expect(200)).text, 'xml')
    assert.equal((await supertest(appUrl).get('/users').expect(204)).text, '')
  })
})
