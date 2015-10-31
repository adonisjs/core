'use strict'

const Nightmare = require('nightmare')
const co = require('co')
const Route = require('../../src/Route')
const chai = require('chai')
const expect = chai.expect
const server = require('./setup')
const Helpers = require('../../src/Helpers')
const cheerio = require('cheerio')
const Ioc = require("adonis-fold").Ioc
const Middleware = require('../../src/Middleware')
require('co-mocha')

describe('Server', function () {

  before(function () {
    server().listen(3000)
    Ioc.autoload(Helpers.appNameSpace(),Helpers.appPath())
  })

  beforeEach(function () {
    Middleware.new()
    Route.new()
  })

  it('should respond to http request whose route is registered', function * () {

    Route.get('/', function * (request, response) {
      response.send("Hello world")
    })

    var nightmare = Nightmare({ show: true });
    var link = yield nightmare
    .goto('http://localhost:3000/')
    .evaluate(function () {
      return document.querySelector('body').innerHTML
    })
    yield nightmare.end()
    expect(link).to.equal("Hello world")
  })

  it('should respond to http request via controller method whose route is registered', function * () {

    Route.get('/', 'HomeController.index')

    var nightmare = Nightmare({ show: true });
    var link = yield nightmare
    .goto('http://localhost:3000/')
    .evaluate(function () {
      return document.querySelector('body').innerHTML
    })
    yield nightmare.end()
    expect(link).to.equal("Hello via controller")

  })

  it('should run middleware in a sequence before reaching request action', function * () {

    Middleware.global(['App/Http/Middleware/Counter'])
    Route.get('/', 'HomeController.counter')

    var nightmare = Nightmare({ show: true });
    var link = yield nightmare
    .goto('http://localhost:3000/')
    .evaluate(function () {
      return document.querySelector('body').innerHTML
    })
    yield nightmare.end()
    expect(link).to.equal("2")

  })

  it('should set response cookie', function * () {

    Route.get('/', 'HomeController.cookie')

    var nightmare = Nightmare({ show: true });
    var link = yield nightmare
    .goto('http://localhost:3000/')
    .evaluate(function () {
      return document.querySelector('body').innerHTML
    })
    .on('did-get-response-details', function (e,s,n,o,h,rm,ref, headers) {
      expect(headers['set-cookie']).deep.equal(['name=virk'])
    })
    yield nightmare.end()
  })

  it('should redirect request to a named route', function * () {

    Route.get('/', 'HomeController.redirect')
    Route.get('/user/:id', 'HomeController.profile').as("profile")
    var nightmare = Nightmare({ show: true });
    var link = yield nightmare
    .goto('http://localhost:3000/')
    .evaluate(function () {
      return document.querySelector('body').innerHTML
    })
    yield nightmare.end()
    expect(link).to.equal("1")
  })


})
