'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Browser = require('zombie')
const Route = require('../../src/Route')
const chai = require('chai')
const expect = chai.expect
const server = require('./setup')
const Helpers = require('../../src/Helpers')
const Ioc = require("adonis-fold").Ioc
const queryString = require('querystring')
const Middleware = require('../../src/Middleware')
require('co-mocha')

Browser.localhost('localhost', 3333)
const browser = new Browser()

describe('App Exceptations', function () {

  before(function () {
    server().listen('0.0.0.0',3333);
    Ioc.autoload(Helpers.appNameSpace(),Helpers.appPath())
  })

  beforeEach(function () {
    Middleware.new()
    Route.new()
  })

  it('should respond to http request with plain text', function * () {
    Route.get('/', function * (request, response) {
      response.send('Hello zombie')
    })
    yield browser.visit('/')
    expect(browser.text("body").trim()).to.equal('Hello zombie')
  })

  it('should respond to http request as json', function * () {
    const user = {
      username: 'virk'
    }
    Route.get('/json', function * (request, response) {
      response.json({user})
    })
    yield browser.visit('/json')
    expect(browser.text("body")).to.equal(JSON.stringify({user}))
  })

  it('should respond via controller', function * () {
    Route.get('/', 'HomeController.index')
    yield browser.visit('/')
    expect(browser.text("body").trim()).to.equal('Hello zombie via controller')
  })

  it('should set cookies on response', function * () {
    Route.get('/', 'HomeController.cookies')
    yield browser.visit('/')
    const cartCookie = JSON.parse(queryString.unescape(browser.getCookie('cart')).replace('j:',''))
    expect(cartCookie).to.have.property('price')
    expect(cartCookie).to.have.property('items')
  })

  it('should serve static resources when route is not registered', function * () {
    yield browser.visit('/style.css')
    expect(browser.text).to.match(/(?:\s*\S+\s*{[^}]*})+/g);
  })

  it('should throw 404 when nothing is found', function * () {
    try{
      yield browser.visit('/production.js')
    }catch (e){
      browser.assert.status(404)
    }
  })

  it('should run global middleware even if no route is defined', function * () {
    Middleware.global(['App/Http/Middleware/Greet'])
    yield browser.visit('/')
    expect(browser.text('body').trim()).to.equal('Greetings!')
  })

  it('should reach route action when middleware yields next', function * () {
    Middleware.global(['App/Http/Middleware/Counter'])
    Route.get('/', function * (request, response) {
      response.send(request.counter);
    })
    yield browser.visit('/')
    expect(browser.text('body').trim()).to.equal('1')
  })

  it('should return the request elapsed when controller has set timeout', function * () {
    Middleware.global(['App/Http/Middleware/Logger'])
    const done = function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve()
        }, 1000)
      })
    }
    Route.get('/', function * (request, response) {
      yield done(request)
    })
    yield browser.visit('/')
    expect(parseInt(browser.text('body').trim())).to.be.above(999)
  })

  it('should redirect request to a named route', function * () {
    Route.get('/', 'HomeController.redirect')
    Route.get('/:id', 'HomeController.profile').as('profile')
    yield browser.visit('/')
    expect(browser.text('body').trim()).to.equal('2')
  })

  it('should clear existing cookies', function * () {
    Route.get('/', function * (request, response) {
      response.clearCookie('name').send('');
    })
    browser.setCookie({name: 'name', value: 'virk'})
    yield browser.visit('/')
    expect(browser.getCookie('name')).to.equal(null);
  })

  it('should response to a url with .json extension', function * () {
    Route.get('/', function * (request, response) {
      response.send('sending via json route')
    }).formats(['json'])
    yield browser.visit('/.json')
    expect(browser.text('body').trim()).to.equal('sending via json route');
  })

  it('should throw 404 when route is not found using a non-registered extension', function * () {
    Route.get('/', function * (request, response) {
      response.send('sending via json route')
    }).formats(['json'])
    try {
      yield browser.visit('/.xml')
    } catch (e) {
      browser.assert.status(404)
    }
  })

  it('should return request format', function * () {
    Route.get('/admin', function * (request, response) {
      response.send(request.format())
    }).formats(['json'])
    yield browser.visit('/admin.json')
    expect(browser.text('body').trim()).to.equal('json')
  })

  it('should send a view using sendView method', function * () {
    Route.get('/', function * (request, response) {
      yield response.sendView('index')
    })
    yield browser.visit('/')
    expect(browser.text('body').trim()).to.equal('sending via view');
  })

  it('should make use of form global helper to setup a form', function * () {
    Route.get('/', function * (request, response) {
      yield response.sendView('form')
    })
    yield browser.visit('/')
    expect(browser.html('form')).not.to.equal('')
    expect(browser.html('input')).not.to.equal('')
    expect(browser.html('button')).not.to.equal('')
  })

  it('should render a view using router render method', function * () {
    Route.on('/signup').render('signup')
    yield browser.visit('/signup?name=virk')
    expect(browser.text('body')).to.equal('the url is /signup and the name is virk')
  })
})
