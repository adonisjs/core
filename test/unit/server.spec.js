'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
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
const _ = require('lodash')
const expect = chai.expect
const http = require('http')
const path = require('path')

require('co-mocha')

describe("Server", function () {

  before(function () {
    const Helpers = {
      publicPath: function () {
        return path.join(__dirname, './public')
      },
      appNamespace : function () {
        return 'App'
      }
    }
    Ioc.autoload('App',path.join(__dirname, './app'))
    const staticServer = new Static(Helpers)
    const Response = new ResponseBuilder({})
    this.server = new Server(Request, Response, Route, Helpers, Middleware,staticServer)
  })

  beforeEach(function () {
    Route.new()
    Middleware.new()
  })

  it("should serve static resource from a given directory", function * (done) {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/style.css').expect('Content-type',/css/).expect(200).end()
    expect(res.text).to.match(/(?:\s*\S+\s*{[^}]*})+/g)
    done()
  })

  it("should serve favicon when request is for favicon", function * (done) {
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/favicon.ico').expect('Content-type',/x-icon/).expect(200).end()
    done()
  })

  it("should call route action if defined", function * (done) {

    Route.get('/', function * (request, response) {
      response.send({rendered:true})
    })

    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.body.rendered).to.equal(true)
    done()
  })

  it("should call route action via controller method", function * (done) {
    Route.get('/', 'HomeController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.body.rendered).to.equal(true)
    done()
  })

  it("should return error when route handler is not of a valid type", function * (done) {
    Route.get('/', {})
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Invalid route handler/)
    done()
  })

  it("should return error when unable to find controller", function * (done) {
    Route.get('/', 'FooController.index')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Cannot find module/)
    done()
  })

  it("should return error when unable to find controller method", function * (done) {
    Route.get('/', 'HomeController.foo')
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/foo does not exists/)
    done()
  })

  it("should return error when unable to resolve middleware", function * (done) {
    Middleware.register('auth',['App/Auth'])
    Route.get('/', 'HomeController.index').middlewares(['auth'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Cannot find module/)
    done()
  })

  it("should return error when unable to find handle method on middleware", function * (done) {
    Middleware.register('auth',['App/Http/Middleware/NoHandle'])
    Route.get('/', 'HomeController.index').middlewares(['auth'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/handle does not exists/)
    done()
  })

  it('should handle call middleware attached to a route', function * (done) {

    Middleware.register('parser','App/Http/Middleware/Parser')
    Middleware.register('cycle','App/Http/Middleware/Cycle2')
    Route.get('/','UserController.index').middlewares(['parser','cycle'])
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.text).to.equal("1")
    done()
  })

  it("should call middlewares attached on route with closure as handler", function * (done) {

    Middleware.register('parser','App/Http/Middleware/Parser')
    Middleware.register('cycle','App/Http/Middleware/Cycle2')
    Route.get('/', function * (request, response) {
      response.send(request.count)
    }).middlewares(['parser','cycle'])

    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(200).end()
    expect(res.text).to.equal("1")
    done()
  })

  it("should report error thrown my route closure", function * (done) {
    Route.get('/', function * (request, response) {
      throw new Error('Unable to login')
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Unable to login/)
    done()
  })

  it("should print default error message when error itself does not have any message", function * (done) {
    Route.get('/', function * (request, response) {
      throw new Error()
    })
    const testServer = http.createServer(this.server.handle.bind(this.server))
    const res = yield supertest(testServer).get('/').expect(500).end()
    expect(res.error.text).to.match(/Internal server error/)
    done()
  })


  it('should listen to server on a given port using listen method', function * (done) {
    process.env.APP_PORT = 3333
    Route.get('/','HomeController.index')
    this.server.listen()
    const testServer = supertest.agent('http://localhost:3333')
    const res = yield testServer.get('/').expect(200).end()
    expect(res.body).deep.equal({rendered:true})
    done()

  })
})
