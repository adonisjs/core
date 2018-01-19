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
const http = require('http')
const { setupResolver, Config, Logger } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const supertest = require('supertest')
const NE = require('node-exceptions')

const Server = require('../../src/Server')
const Route = require('../../src/Route/Manager')
const RouteStore = require('../../src/Route/Store')
const Request = require('../../src/Request')
const Response = require('../../src/Response')
const Context = require('../../src/Context')
const Exception = require('../../src/Exception')
const BaseExceptionHandler = require('../../src/Exception/BaseHandler')

const config = new Config()

class FakeExceptionHandler {
  handle (error, { response }) {
    response.status(error.status).send(`${error.name}: ${error.message}\n${error.stack}`)
  }

  report () {}
}

test.group('Server | Middleware', (group) => {
  group.before(() => {
    setupResolver()
  })

  test('register global middleware', (assert) => {
    const server = new Server()
    server.registerGlobal(['foo', 'bar'])
    assert.deepEqual(server._middleware.global, [
      {
        namespace: 'foo.handle',
        params: []
      },
      {
        namespace: 'bar.handle',
        params: []
      }
    ])
  })

  test('append middleware when registerGlobal called multiple times', (assert) => {
    const server = new Server()
    server.registerGlobal(['foo', 'bar']).registerGlobal(['baz'])
    assert.deepEqual(server._middleware.global, [
      {
        namespace: 'foo.handle',
        params: []
      },
      {
        namespace: 'bar.handle',
        params: []
      },
      {
        namespace: 'baz.handle',
        params: []
      }
    ])
  })

  test('throw exception when middleware is not an array', (assert) => {
    const server = new Server()
    const fn = () => server.registerGlobal('foo')
    assert.throw(fn, 'server.registerGlobal accepts an array of middleware instead received string')
  })

  test('log warning when duplicate middleware are registered', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)
    server.registerGlobal(['foo']).registerGlobal(['foo'])
    assert.isTrue(
      logger.has('warn', 'Detected existing global middleware {foo}, the current one will be ignored')
    )
    assert.deepEqual(server._middleware.global, [
      {
        namespace: 'foo.handle',
        params: []
      }
    ])
  })

  test('register named middleware', (assert) => {
    const server = new Server()
    const named = {
      auth: 'App/Middleware/Auth'
    }
    server.registerNamed(named)
    assert.deepEqual(server._middleware.named, {
      auth: {
        namespace: 'App/Middleware/Auth.handle',
        params: []
      }
    })
  })

  test('register multiple named middleware', (assert) => {
    const server = new Server()
    server
      .registerNamed({ auth: 'App/Middleware/Auth' })
      .registerNamed({ addonValidator: 'App/Middleware/Validator' })

    assert.deepEqual(server._middleware.named, {
      auth: {
        namespace: 'App/Middleware/Auth.handle',
        params: []
      },
      addonValidator: {
        namespace: 'App/Middleware/Validator.handle',
        params: []
      }
    })
  })

  test('throw exception when named middleware payload is not an object', (assert) => {
    const server = new Server()
    const fn = () => server.registerNamed(['foo'])
    assert.throw(fn, `server.registerNamed accepts a key/value pair of middleware instead received array`)
  })

  test('register server level middleware', (assert) => {
    const server = new Server()
    server.use(['foo'])
    assert.deepEqual(server._middleware.server, [{
      namespace: 'foo.handle',
      params: []
    }])
  })

  test('concat server level middleware when called use for multiple times', (assert) => {
    const server = new Server()
    server.use(['foo']).use(['bar'])
    assert.deepEqual(server._middleware.server, [
      {
        namespace: 'foo.handle',
        params: []
      },
      {
        namespace: 'bar.handle',
        params: []
      }
    ])
  })

  test('log warning when duplicate server middleware are registered', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)
    server.use(['foo']).use(['foo'])
    assert.isTrue(
      logger.has('warn', 'Detected existing server middleware {foo}, the current one will be ignored')
    )
    assert.deepEqual(server._middleware.server, [{
      namespace: 'foo.handle',
      params: []
    }])
  })

  test('compile named middleware', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    const namedMiddleware = ['auth']
    server.registerNamed({ auth: function () {} })

    const middleware = server._compileNamedMiddleware(namedMiddleware)
    assert.deepEqual(middleware, [server._middleware.named.auth])
  })

  test('define raw function as named middleware', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    const namedMiddleware = [function () {}]

    const middleware = server._compileNamedMiddleware(namedMiddleware)
    assert.deepEqual(middleware, [
      { namespace: namedMiddleware[0], params: [] }
    ])
  })

  test('parse params defined on named middleware', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    const namedMiddleware = ['auth:jwt']

    server.registerNamed({ auth: function () {} })

    const middleware = server._compileNamedMiddleware(namedMiddleware, {})
    assert.deepEqual(middleware, [
      { namespace: server._middleware.named.auth.namespace, params: ['jwt'] }
    ])
  })

  test('throw exception when named middleware is not registered', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    const namedMiddleware = ['auth:jwt']
    const middleware = () => server._compileNamedMiddleware(namedMiddleware)
    assert.throw(middleware, 'E_MISSING_NAMED_MIDDLEWARE: Cannot find any named middleware for {auth}. Make sure you have registered it inside start/kernel.js file.')
  })

  test('throw exception when middleware is not a string or function', (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)
    const namedMiddleware = [{}]
    const middleware = () => server._compileNamedMiddleware(namedMiddleware, {})
    assert.throw(middleware, 'E_INVALID_MIDDLEWARE_TYPE: Middleware must be a function or reference to an IoC container string.')
  })

  test('compose server middleware and execute them', async (assert) => {
    assert.plan(1)

    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    server.use([function () {
      assert.isTrue(true)
    }])

    await server._executeServerMiddleware()
  })

  test('pass ctx to middleware', async (assert) => {
    assert.plan(1)

    const logger = new Logger()
    const server = new Server({}, {}, logger, config)
    const ctx = {
      req: {}
    }

    server.use([function (__ctx__) {
      assert.deepEqual(__ctx__, ctx)
    }])

    await server._executeServerMiddleware(ctx)
  })

  test('execute middleware in sequence', async (assert) => {
    const logger = new Logger()
    const server = new Server({}, {}, logger, config)
    const stack = []
    const ctx = {
      req: {}
    }

    const fn1 = function (__ctx__, next) {
      __ctx__.first = true
      stack.push('first')
      return next()
    }

    const fn2 = function (__ctx__, next) {
      __ctx__.second = true
      stack.push('second')
      return next()
    }

    server.use([fn1, fn2])
    await server._executeServerMiddleware(ctx)
    assert.deepEqual(stack, ['first', 'second'])
    assert.isTrue(ctx.first)
    assert.isTrue(ctx.second)
  })

  test('compose global middleware and execute them', async (assert) => {
    assert.plan(1)

    const logger = new Logger()
    const server = new Server({}, {}, logger, config)

    server.registerGlobal([function () {
      assert.isTrue(true)
    }])

    await server._executeRouteHandler([])
  })

  test('compose global middleware with route middleware and execute them', async (assert) => {
    const logger = new Logger()
    const stack = []
    const server = new Server({}, {}, logger, config)

    server.registerGlobal([function (ctx, next) {
      stack.push('global')
      return next()
    }])

    server.registerNamed({
      auth: function (ctx, next) {
        stack.push('named')
        return next()
      }
    })

    await server._executeRouteHandler(['auth'], {}, { namespace: function () {}, params: [] })
    assert.deepEqual(stack, ['global', 'named'])
  })

  test('pass params to route middleware', async (assert) => {
    const logger = new Logger()
    const stack = []
    const server = new Server({}, {}, logger, config)

    server.registerGlobal([function (ctx, next) {
      stack.push('global')
      return next()
    }])

    server.registerNamed({
      auth: function (ctx, next, params) {
        stack.push(params)
        return next()
      }
    })

    await server._executeRouteHandler(['auth:jwt'], {}, { namespace: function () {}, params: [] })
    assert.deepEqual(stack, ['global', ['jwt']])
  })
})

test.group('Server | Calls', (group) => {
  group.before(() => {
    Context.getter('request', function () {
      return new Request(this.req, this.res, new Config())
    }, true)

    Context.getter('response', function () {
      const config = new Config()
      config.set('app.http.jsonpCallback', 'callback')
      return new Response(this.request, config)
    }, true)
    setupResolver()
  })

  group.beforeEach(() => {
    this.logger = new Logger()
    this.exception = Exception
    RouteStore.clear()
    ioc.restore()
    this.exception.clear()
  })

  test('respond to a http request using the route handler', async (assert) => {
    Route.get('/', function ({ response }) {
      response.send('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('respond http request when route handler is an async function', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.send('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('respond http request by returning a value', async (assert) => {
    Route.get('/', async function () {
      return 'foo'
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('send 500 when route has an unhandled exception', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.split('\n')[0].trim(), 'Error: error')
  })

  test('run route middleware when defined', async (assert) => {
    Route.get('/', async function ({ request }) {
      return request.called
    }).middleware(async function ({ request }, next) {
      request.called = true
      await next()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'true')
  })

  test('execute global middleware before named middleware', async (assert) => {
    Route.get('/', async function ({ request }) {
      return request.middleware
    }).middleware(async function ({ request }, next) {
      request.middleware.push('named')
      await next()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerGlobal([async function ({ request }, next) {
      request.middleware = request.middleware || []
      request.middleware.push('global')
      await next()
    }])
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.body, ['global', 'named'])
  })

  test('do not execute middleware when route not found', async (assert) => {
    const executions = []

    Route.get('/', async function () {
    }).middleware(async function (ctx, next) {
      executions.push(true)
      await next()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    server.registerGlobal([async function (next) {
      executions.push(true)
      await next()
    }])

    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/foo').expect(404)
    assert.lengthOf(executions, 0)
    assert.deepEqual(executions, [])
  })

  test('execute server level middleware when no route is found', async (assert) => {
    const executions = []

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    server.use([async function (ctx, next) {
      executions.push('server')
      await next()
    }])

    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/foo').expect(404)
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('execute middleware in reverse after controller', async (assert) => {
    Route.get('/', async function ({ request }) {
      return request.middleware
    }).middleware(async function ({ request, response }, next) {
      request.middleware.push('named')
      await next()
      response.lazyBody.content.push('after named')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerGlobal([async function ({ request, response }, next) {
      request.middleware = request.middleware || []
      request.middleware.push('global')
      await next()
      response.lazyBody.content.push('after global')
    }])
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.body, ['global', 'named', 'after named', 'after global'])
  })

  test('change response in after middleware even after send is called', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.send('foo')
    }).middleware(async function ({ response }, next) {
      await next()
      response.send('changed foo to bar')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'changed foo to bar')
  })

  test('stack should point to right line when route has error', async (assert) => {
    Route.get('/', async function () {
      throw new Error('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.include(res.text.split('\n')[2], 'server.spec.js:531')
  })

  test('do not execute anything once server level middleware ends the response', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    server.use([async function ({ response }) {
      executions.push('server')
      response.send('serve css file')
    }])

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'serve css file')
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('do not execute route once global middleware ends the response', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerGlobal([async function ({ response }, next) {
      executions.push('global')
      response.send('ending here')
    }])

    server.use([async function () {
      executions.push('server')
    }])

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'ending here')
    assert.lengthOf(executions, 2)
    assert.deepEqual(executions, ['server', 'global'])
  })

  test('pass route params to route handler', async (assert) => {
    Route.get('/:username', async function ({ params }) {
      return params.username
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/virk').expect(200)
    assert.equal(res.text, 'virk')
  })

  test('pass null when route param is optional and missing', async (assert) => {
    Route.get('/:username?', async function ({ params }) {
      return params.username === null ? 'virk' : params.username
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'virk')
  })

  test('middleware should also be to access params', async (assert) => {
    Route.get('/:username', async function () {
    }).middleware(async function ({ response, params }, next) {
      response.send(params.username)
      await next()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/nikk').expect(200)
    assert.equal(res.text, 'nikk')
  })

  test('bind controller to route', async (assert) => {
    class HomeController {
      async render () {
        return 'hello world'
      }
    }

    ioc.fake('App/Controllers/Http/HomeController', function () {
      return new HomeController()
    })

    Route.get('/', 'HomeController.render')

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'hello world')
  })

  test('throw exception when controller does not exists', async (assert) => {
    Route.get('/', 'HomeController.render')

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.split('\n')[0], `Error: Cannot find module 'App/Controllers/Http/HomeController'`)
  })

  test('throw exception when controller method does not exists', async (assert) => {
    class HomeController {
    }

    ioc.fake('App/Controllers/Http/HomeController', function () {
      return new HomeController()
    })

    Route.get('/', 'HomeController.render')

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.split('\n')[0], 'RuntimeException: E_UNDEFINED_METHOD: Method render missing on App/Controllers/Http/HomeController')
  })

  test('bind global middleware via ioc container', async (assert) => {
    class AppMiddleware {
      async handle ({ response }) {
        response.send('hello from middleware')
      }
    }

    ioc.fake('Middleware/AppMiddleware', function () {
      return new AppMiddleware()
    })

    Route.get('/', async function () {})
    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerGlobal(['Middleware/AppMiddleware'])

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'hello from middleware')
  })

  test('bind named middleware via ioc container', async (assert) => {
    class AppMiddleware {
      async handle ({ response }) {
        response.send('hello from middleware')
      }
    }

    ioc.fake('Middleware/AppMiddleware', function () {
      return new AppMiddleware()
    })

    Route.get('/', async function () {}).middleware('app')
    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerNamed({
      'app': 'Middleware/AppMiddleware'
    })

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'hello from middleware')
  })

  test('throw exception when named middleware is missing', async (assert) => {
    Route.get('/', async function () {}).middleware('app')
    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.split('\n')[0], 'RuntimeException: E_MISSING_NAMED_MIDDLEWARE: Cannot find any named middleware for {app}. Make sure you have registered it inside start/kernel.js file.')
  })

  test('pass runtime middleware arguments middleware', async (assert) => {
    class Auth {
      async handle ({ response }, next, authenticators) {
        response.send(authenticators)
      }
    }

    ioc.fake('Middleware/Auth', function () {
      return new Auth()
    })

    Route.get('/', async function () {}).middleware('auth:jwt,basic')
    const server = new Server(Context, Route, this.logger, this.exception)
    server.registerNamed({
      'auth': 'Middleware/Auth'
    })

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.body, ['jwt', 'basic'])
  })

  test('serve on existing http server', async (assert) => {
    Route.get('/', async function () {
      return 'hello world'
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    const app = server.getInstance(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.text, 'hello world')
  })

  test('pass exception to custom exception handler', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    this.exception.handle('Error', (error, { response }) => {
      response.status(error.status).send('Hijacked')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)
    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.trim(), 'Hijacked')
  })

  test('exception handler can be async', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    this.exception.handle('Error', (error, { response }) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          response.status(error.status).send('Hijacked')
          resolve()
        }, 200)
      })
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)

    const app = http.createServer(server.handle.bind(server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.trim(), 'Hijacked')
  })

  test('report error to exception reporter', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    const reportedError = {}
    this.exception.report('Error', (error, { request }) => {
      reportedError.name = error.name
      reportedError.url = request.url()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)
    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/').expect(500)
    assert.deepEqual(reportedError, { name: 'Error', url: '/' })
  })

  test('report error to exception reporter even when it\'s async', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    const reportedError = {}
    this.exception.report('Error', async (error, { request }) => {
      reportedError.name = error.name
      reportedError.url = request.url()
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)
    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/').expect(500)
    assert.deepEqual(reportedError, { name: 'Error', url: '/' })
  })

  test('exceptions should be able to handle themselves', async (assert) => {
    class HttpException extends NE.LogicalException {
      handle (error, { response }) {
        response.status(500).send({ name: error.name, message: error.message })
      }
    }

    Route.get('/', async function () {
      throw new HttpException('Something went bad')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { body } = await supertest(app).get('/').expect(500)
    assert.deepEqual(body, { name: 'HttpException', message: 'Something went bad' })
  })

  test('exceptions should be able to report themselves', async (assert) => {
    let reportedMessage = null

    class HttpException extends NE.LogicalException {
      handle (error, { response }) {
        response.status(500).send({ name: error.name, message: error.message })
      }

      report ({ message }) {
        reportedMessage = message
      }
    }

    Route.get('/', async function () {
      throw new HttpException('Something went bad')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    await supertest(app).get('/').expect(500)
    assert.equal(reportedMessage, 'Something went bad')
  })

  test('disable implicit end of response', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.implicitEnd = false
      setTimeout(() => {
        response.send('done')
      }, 100)
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/').expect(200)
    assert.equal(text, 'done')
  })

  test('disable implicit end of response when calling jsonp', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.implicitEnd = false
      setTimeout(() => {
        response.jsonp({ username: 'virk' })
      }, 100)
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/').expect(200)
    assert.equal(text, `/**/ typeof callback === 'function' && callback(${JSON.stringify({ username: 'virk' })});`)
  })

  test('disable implicit end of response when calling json', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.implicitEnd = false
      setTimeout(() => {
        response.json({ username: 'virk' })
      }, 100)
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { body } = await supertest(app).get('/').expect(200)
    assert.deepEqual(body, { username: 'virk' })
  })

  test('send json response', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.json({ username: 'virk' })
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { body } = await supertest(app).get('/').expect(200)
    assert.deepEqual(body, { username: 'virk' })
  })

  test('disable implicit end with descriptiveMethods', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.implicitEnd = false
      setTimeout(() => {
        response.ok('done')
      }, 100)
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/').expect(200)
    assert.deepEqual(text, 'done')
  })

  test('server level middleware end response by ending the response explicitly', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    server.use([async function ({ response }) {
      executions.push('server')
      response.end()
    }])

    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/').expect(204)
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('server level middleware end response by setting status code as 204', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(FakeExceptionHandler)

    server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    server.use([async function ({ response }) {
      executions.push('server')
      response.status(204).send('')
    }])

    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/').expect(204)
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('catch errors thrown by sync route closures', async (assert) => {
    Route.get('/', function () {
      throw new Error('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)
    server.setExceptionHandler(BaseExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/').expect(500)
    assert.include(text, 'Error: foo')
  })

  test('catch errors thrown within exception handler', async (assert) => {
    Route.get('/', function () {
      throw new Error('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)

    this.exception.handle('Error', function () {
      throw new Error('Blowed up')
    })

    server.setExceptionHandler(BaseExceptionHandler)

    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/').expect(500)
    assert.include(text, 'Error: Blowed up')
  })

  test('return error when exception handler doesnt have a handle method', async (assert) => {
    const server = new Server(Context, Route, this.logger, this.exception)
    class CustomHandler {}
    const fn = () => server.setExceptionHandler(CustomHandler)
    assert.throw(fn, /E_RUNTIME_ERROR: Http exception handler must have handle and report methods on it/)
  })

  test('return error when exception handler doesnt have a report method', async (assert) => {
    const server = new Server(Context, Route, this.logger, this.exception)
    class CustomHandler {
      handle () {}
    }
    const fn = () => server.setExceptionHandler(CustomHandler)
    assert.throw(fn, /E_RUNTIME_ERROR: Http exception handler must have handle and report methods on it/)
  })

  test('setting http instance after starting the server must throw exception', (assert, done) => {
    const server = new Server(Context, Route, this.logger, this.exception)
    server.listen()
    const fn = () => server.setInstance()
    assert.throw(
      fn,
      /E_CANNOT_SWAP_SERVER: Attempt to hot swap http instance failed. Make sure to call Server.setInstance before starting the http server/
    )
    server.close(function () {
      done()
    })
  })

  test('set a custom http server', async (assert) => {
    const server = new Server(Context, Route, this.logger, this.exception)

    const httpServer = http.createServer(function (req, res) {
      res.end('Custom instance response')
    })

    server.setInstance(httpServer)
    server.listen()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'Custom instance response')
    server.close()
  })
})
