'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Server = require('../../src/Server')
const Request = require('../../src/Request')
const ResponseBuilder = require('../../src/Response')
const Static = require('../../src/Static')
const Route = require('../../src/Route')
const Middleware = require('../../src/Middleware')
const chai = require('chai')
const Ioc = require('adonis-fold').Ioc
const supertest = require('co-supertest')
const expect = chai.expect
const http = require('http')
const EventProvider = require('../../src/Event')
const path = require('path')
const stderr = require('test-console').stderr

class Session {

}
const Config = {
  get: function (key) {
    switch (key) {
      case 'app.static':
        return {}
      case 'event':
        return {
          wildcard: true,
          delimiter: ':'
        }
      case 'app.http.allowMethodSpoofing':
        return true
      default:
        return 2
    }
  }
}

const Helpers = {
  publicPath: function () {
    return path.join(__dirname, './public')
  },
  makeNameSpace: function (base, toPath) {
    return `App/${base}/${toPath}`
  }
}

const Event = new EventProvider(Config)

require('co-mocha')

describe('Server', function () {
  before(function () {
    Ioc.autoload('App', path.join(__dirname, './app'))
    const staticServer = new Static(Helpers, Config)
    const Response = new ResponseBuilder({}, {}, Config)
    this.server = new Server(Request, Response, Route, Helpers, Middleware, staticServer, Session, Config, Event)
  })

  beforeEach(function () {
    Route.new()
    Middleware.new()
  })

  it('should serve static resource from a given directory', function * () {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/style.css').expect('Content-type', /css/).expect(200).end()
    expect(res.text).to.match(/(?:\s*\S+\s*{[^}]*})+/g)
  })

  it('should serve favicon when request is for favicon', function * () {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    yield supertest(testServer).get('/favicon.ico').expect('Content-type', /x-icon/).expect(200).end()
  })

  it('should make 404 error when unable to find static resource', function * () {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    yield supertest(testServer).get('/foo.css').expect(404).end()
  })

  it('should not serve static resources with route is not GET or HEAD', function * () {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    yield supertest(testServer).post('/style.css').expect(404).end()
  })

  it('should serve static resource even if route is defined', function * () {
    Route.get('/favicon.ico', function * (request, response) {
      response.send({rendered: true})
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    yield supertest(testServer).get('/favicon.ico').expect('Content-type', /x-icon/).expect(200).end()
  })

  it('should call route action if defined', function * () {
    Route.get('/', function * (request, response) {
      response.send({rendered: true})
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.body.rendered).to.equal(true)
  })

  it('should invoke route for verb defined using _method', function * () {
    Route.put('/', function * (request, response) {
      response.send({rendered: true})
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/?_method=PUT').expect(200).end()
    expect(res.body.rendered).to.equal(true)
  })

  it('should not spoof request method when allowMethodSpoofing is not turned on', function * () {
    Route.put('/', function * (request, response) {
      response.send({rendered: true})
    })
    const staticServer = new Static(Helpers, Config)
    const Response = new ResponseBuilder({}, {}, Config)
    const customConfig = {
      get: function (key) {
        if (key === 'app.http.allowMethodSpoofing') {
          return false
        }
        return Config.get(key)
      }
    }
    const server = new Server(Request, Response, Route, Helpers, Middleware, staticServer, Session, customConfig, Event)
    const testServer = http.createServer(server.handle.bind(server))
    yield supertest(testServer).get('/?_method=PUT').expect(404).end()
  })

  it('should not log warning when allowMethodSpoofing is not turned on but trying to spoof method', function * () {
    Route.put('/', function * (request, response) {
      response.send({rendered: true})
    })
    const inspect = stderr.inspect()
    const staticServer = new Static(Helpers, Config)
    const Response = new ResponseBuilder({}, {}, Config)
    const customConfig = {
      get: function (key) {
        if (key === 'app.http.allowMethodSpoofing') {
          return false
        }
        return Config.get(key)
      }
    }
    const server = new Server(Request, Response, Route, Helpers, Middleware, staticServer, Session, customConfig, Event)
    const testServer = http.createServer(server.handle.bind(server))
    yield supertest(testServer).get('/?_method=PUT').expect(404).end()
    inspect.restore()
    expect(inspect.output.join('')).to.match(/You are making use of method spoofing/)
  })

  it('should call route action via controller method', function * () {
    Route.get('/', 'HomeController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.body.rendered).to.equal(true)
  })

  it('should return error when route handler is not of a valid type', function * () {
    Route.get('/', {})
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/InvalidArgumentException: E_INVALID_PARAMETER: Route action must be a function or a reference to the controller method/)
  })

  it('should return error when unable to find controller', function * () {
    Route.get('/', 'FooController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Cannot find module/)
  })

  it('should return error when unable to find controller method', function * () {
    Route.get('/', 'HomeController.foo')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/foo does not exists/)
  })

  it('should call all global middleware before reaching the route handler', function * () {
    Middleware.global(['App/Http/Middleware/Global'])
    Route.get('/', 'UserController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.text).to.equal('2')
  })

  it('should catch errors created by global middleware', function * () {
    Middleware.global(['App/Http/Middleware/GlobalCatch'])
    Route.get('/', 'UserController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(401).end()
    expect(res.error.text).to.equal('Login')
  })

  it('should catch errors thrown by global middleware', function * () {
    Middleware.global(['App/Http/Middleware/GlobalThrow'])
    Route.get('/', 'UserController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(401).end()
    expect(res.error.text).to.match(/Error: Login/)
  })

  it('should return error when unable to resolve middleware', function * () {
    Middleware.register('auth', ['App/Auth'])
    Route.get('/', 'HomeController.index').middlewares(['auth'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Cannot find module/)
  })

  it('should return error when unable to find handle method on middleware', function * () {
    Middleware.register('auth', ['App/Http/Middleware/NoHandle'])
    Route.get('/', 'HomeController.index').middlewares(['auth'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/handle does not exists/)
  })

  it('should handle call middleware attached to a route', function * () {
    Middleware.register('parser', 'App/Http/Middleware/Parser')
    Middleware.register('cycle', 'App/Http/Middleware/Cycle2')
    Route.get('/', 'UserController.index').middlewares(['parser', 'cycle'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.text).to.equal('1')
  })

  it('should call middlewares attached on route with closure as handler', function * () {
    Middleware.register('parser', 'App/Http/Middleware/Parser')
    Middleware.register('cycle', 'App/Http/Middleware/Cycle2')
    Route.get('/', function * (request, response) {
      response.send(request.count)
    }).middlewares(['parser', 'cycle'])

    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.text).to.equal('1')
  })

  it('should report error thrown my route closure', function * () {
    Route.get('/', function * () {
      throw new Error('Unable to login')
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Unable to login/)
  })

  it('should show default error stack when error itself does not have any message', function * () {
    Route.get('/', function * () {
      throw new Error()
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Error/)
  })

  it('should emit error event when there are listeners attach to error', function * () {
    Event.when('Http:error:*', function (error, request, response) {
      response.status(401).send(error.message)
    })
    Route.get('/', function * () {
      throw new Error('Forbidden')
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(401).end()
    expect(res.error.text).to.equal('Forbidden')
  })

  it('should server instance is null', function * () {
    expect(this.server.httpInstance).to.be.null
  })

  it('should server instance is http.Server', function * () {
    const httpServer = this.server.getInstance()
    expect(httpServer).to.be.instanceOf(http.Server)
    expect(this.server.httpInstance).to.be.instanceOf(http.Server)
  })

  it('should listen to server on a given port and host using listen method', function * () {
    Route.get('/', 'HomeController.index')
    this.server.listen('0.0.0.0', 8000)
    const testServer = supertest.agent('http://127.0.0.1:8000')
    const res = yield testServer.get('/').expect(200).end()
    expect(res.body).deep.equal({rendered: true})
  })
})
