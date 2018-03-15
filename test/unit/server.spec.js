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
const fs = require('fs-extra')
const path = require('path')

const Server = require('../../src/Server')
const Route = require('../../src/Route/Manager')
const RouteStore = require('../../src/Route/Store')
const Request = require('../../src/Request')
const Response = require('../../src/Response')
const Context = require('../../src/Context')
const Exception = require('../../src/Exception')
const BaseExceptionHandler = require('../../src/Exception/BaseHandler')

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
    ioc.autoload(path.join(__dirname, 'app'), 'App')
  })

  group.beforeEach(() => {
    this.exception = Exception
    this.server = new Server(Context, Route, new Logger(), this.exception)
    this.server.bindExceptionHandler()

    ioc.fake('Adonis/Exceptions/BaseExceptionHandler', () => {
      return new BaseExceptionHandler()
    })
  })

  group.afterEach(() => {
    RouteStore.clear()
    ioc.restore()
    this.exception.clear()
  })

  test('respond to a http request using the route handler', async (assert) => {
    Route.get('/', function ({ response }) {
      response.send('foo')
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('respond http request when route handler is an async function', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.send('foo')
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('respond http request by returning a value', async (assert) => {
    Route.get('/', async function () {
      return 'foo'
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'foo')
  })

  test('send 500 when route has an unhandled exception', async (assert) => {
    Route.get('/', async function () {
      throw new Error('error')
    })

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

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

    this.server.registerGlobal([async function ({ request }, next) {
      request.middleware = request.middleware || []
      request.middleware.push('global')
      await next()
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

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

    this.server.registerGlobal([async function (next) {
      executions.push(true)
      await next()
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

    await supertest(app).get('/foo').expect(404)
    assert.lengthOf(executions, 0)
    assert.deepEqual(executions, [])
  })

  test('execute server level middleware when no route is found', async (assert) => {
    const executions = []

    this.server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    this.server.use([async function (ctx, next) {
      executions.push('server')
      await next()
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

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

    this.server.registerGlobal([async function ({ request, response }, next) {
      request.middleware = request.middleware || []
      request.middleware.push('global')
      await next()
      response.lazyBody.content.push('after global')
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'changed foo to bar')
  })

  test('do not execute anything once server level middleware ends the response', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    this.server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    this.server.use([async function ({ response }) {
      executions.push('server')
      response.send('serve css file')
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

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

    this.server.registerGlobal([async function ({ response }, next) {
      executions.push('global')
      response.send('ending here')
    }])

    this.server.use([async function () {
      executions.push('server')
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'ending here')
    assert.lengthOf(executions, 2)
    assert.deepEqual(executions, ['server', 'global'])
  })

  test('pass route params to route handler', async (assert) => {
    Route.get('/:username', async function ({ params }) {
      return params.username
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/virk').expect(200)
    assert.equal(res.text, 'virk')
  })

  test('pass null when route param is optional and missing', async (assert) => {
    Route.get('/:username?', async function ({ params }) {
      return params.username === null ? 'virk' : params.username
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'virk')
  })

  test('middleware should also be to access params', async (assert) => {
    Route.get('/:username', async function () {
    }).middleware(async function ({ response, params }, next) {
      response.send(params.username)
      await next()
    })

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'hello world')
  })

  test('throw exception when controller does not exists', async (assert) => {
    Route.get('/', 'HomeController.render')

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(500)
    assert.equal(res.text.split('\n')[0], `Error: Cannot find module '${path.join(__dirname, 'app', 'Controllers', 'Http', 'HomeController')}'`)
  })

  test('throw exception when controller method does not exists', async (assert) => {
    class HomeController {
    }

    ioc.fake('App/Controllers/Http/HomeController', function () {
      return new HomeController()
    })

    Route.get('/', 'HomeController.render')

    const app = http.createServer(this.server.handle.bind(this.server))

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
    this.server.registerGlobal(['Middleware/AppMiddleware'])

    const app = http.createServer(this.server.handle.bind(this.server))

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
    this.server.registerNamed({
      'app': 'Middleware/AppMiddleware'
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.equal(res.text, 'hello from middleware')
  })

  test('throw exception when named middleware is missing', async (assert) => {
    Route.get('/', async function () {}).middleware('app')

    const app = http.createServer(this.server.handle.bind(this.server))

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
    this.server.registerNamed({
      'auth': 'Middleware/Auth'
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.body, ['jwt', 'basic'])
  })

  test('serve on existing http server', async (assert) => {
    Route.get('/', async function () {
      return 'hello world'
    })

    const app = this.server.getInstance(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))

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

    const app = http.createServer(this.server.handle.bind(this.server))
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

    const app = http.createServer(this.server.handle.bind(this.server))
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

    const app = http.createServer(this.server.handle.bind(this.server))
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

    const app = http.createServer(this.server.handle.bind(this.server))
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

    const app = http.createServer(this.server.handle.bind(this.server))
    const { body } = await supertest(app).get('/').expect(200)
    assert.deepEqual(body, { username: 'virk' })
  })

  test('send json response', async (assert) => {
    Route.get('/', async function ({ response }) {
      response.json({ username: 'virk' })
    })

    const app = http.createServer(this.server.handle.bind(this.server))
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

    const app = http.createServer(this.server.handle.bind(this.server))
    const { text } = await supertest(app).get('/').expect(200)
    assert.deepEqual(text, 'done')
  })

  test('server level middleware end response by ending the response explicitly', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    this.server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    this.server.use([async function ({ response }) {
      executions.push('server')
      response.end()
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

    await supertest(app).get('/').expect(204)
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('server level middleware end response by setting status code as 204', async (assert) => {
    const executions = []

    Route.get('/', async function () {
      executions.push('route')
    })

    this.server.registerGlobal([async function (ctx, next) {
      executions.push('global')
      await next()
    }])

    this.server.use([async function ({ response }) {
      executions.push('server')
      response.status(204).send('')
    }])

    const app = http.createServer(this.server.handle.bind(this.server))

    await supertest(app).get('/').expect(204)
    assert.lengthOf(executions, 1)
    assert.deepEqual(executions, ['server'])
  })

  test('catch errors thrown by sync route closures', async (assert) => {
    Route.get('/', function () {
      throw new Error('foo')
    })

    const app = http.createServer(this.server.handle.bind(this.server))
    const { text } = await supertest(app).get('/').expect(500)
    assert.include(text, 'Error: foo')
  })

  test('catch errors thrown within exception handler', async (assert) => {
    Route.get('/', function () {
      throw new Error('foo')
    })

    this.exception.handle('Error', function () {
      throw new Error('Blowed up')
    })

    const app = http.createServer(this.server.handle.bind(this.server))
    const { text } = await supertest(app).get('/').expect(500)
    assert.include(text, 'Error: Blowed up')
  })

  test('setting http instance after starting the server must throw exception', (assert, done) => {
    this.server.listen()
    const fn = () => this.server.setInstance()

    assert.throw(
      fn,
      /E_CANNOT_SWAP_SERVER: Attempt to hot swap http instance failed. Make sure to call Server.setInstance before starting the http server/
    )

    this.server.close(function () {
      done()
    })
  })

  test('set a custom http server', async (assert) => {
    const httpServer = http.createServer(function (req, res) {
      res.end('Custom instance response')
    })

    this.server.setInstance(httpServer)
    this.server.listen()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'Custom instance response')
    this.server.close()
  })

  test('use default exception handler when app handler file doesn\'t exists', async (assert) => {
    const handler = this.server._getExceptionHandlerNamespace()
    assert.equal(handler, 'Adonis/Exceptions/BaseExceptionHandler')
  })

  test('use app exceptions handler when it exists', async (assert) => {
    await fs.outputFile(path.join(__dirname, 'app/Exceptions', 'Handler.js'), 'foo')

    const handler = this.server._getExceptionHandlerNamespace()
    await fs.remove(path.join(__dirname, 'app'))

    assert.equal(handler, 'App/Exceptions/Handler')
  })

  test('use same named middleware twice with different params', async (assert) => {
    class AppMiddleware {
      async handle (ctx, next, [id]) {
        ctx.ids = ctx.ids || []
        ctx.ids.push(id)
        await next()
      }
    }

    ioc.fake('Middleware/AppMiddleware', function () {
      return new AppMiddleware()
    })

    Route.get('/', async function ({ ids }) {
      return ids
    })
      .middleware('app:1')
      .middleware('app:2')

    this.server.registerNamed({
      'app': 'Middleware/AppMiddleware'
    })

    const app = http.createServer(this.server.handle.bind(this.server))

    const res = await supertest(app).get('/').expect(200)
    assert.deepEqual(res.body, ['1', '2'])
  })
})
