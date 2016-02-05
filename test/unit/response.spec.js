'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Request = require('../../src/Request')
const ResponseBuilder = require('../../src/Response')
const Route = require('../../src/Route')
const View = require('../../src/View')
const http = require('http')
const path = require('path')
const co = require('co')
const supertest = require('co-supertest')

require('co-mocha')

const Config = {
  get: function (key) {
    switch (key) {
      case 'app.views.cache':
        return true
      case 'app.http.jsonpCallback':
        return 'callback'
      case 'app.http.setPoweredBy':
        return true
      default: true
    }
  }
}

describe('Response', function () {

  before(function () {
    const Helpers = {
      viewsPath: function () {
        return path.join(__dirname,'./app/views')
      }
    }

    const view = new View(Helpers, Config, Route)
    this.Response = new ResponseBuilder(view, Route, Config)
  })

  beforeEach(function () {
    Route.new()
  })

  it('should respond to a request using send method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.send("Hello world")
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.text).to.equal("Hello world")
    done()
  })

  it('should make use of descriptive methods exposed by nodeRes', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.ok("Hello world")
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.text).to.equal("Hello world")
    done()
  })

  it('should return 401 using unauthorized method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.unauthorized("Login first")
    })

    const res = yield supertest(server).get('/').expect(401).end()
    expect(res.text).to.equal("Login first")
    done()
  })

  it('should return 500 using internalServerError method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.internalServerError("Error first")
    })
    const res = yield supertest(server).get('/').expect(500).end()
    expect(res.text).to.equal("Error first")
    done()
  })


  it('should set header on response', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.header("country","India").send('')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers.country).to.equal("India")
    done()
  })

  it('should remove existing from request', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.removeHeader("country","India").send('')
    })

    const res = yield supertest(server).get('/').set('country','India').expect(200).end()
    expect(res.headers.country).to.equal(undefined)
    done()

  })

  it('should make json response using json method', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.json({name:"foo"})
    })

    const res = yield supertest(server).get('/').expect(200).expect('Content-type',/json/).end()
    expect(res.body).deep.equal({name:"foo"})
    done()
  })

  it('should make jsonp response using jsonp method with correct callback', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.jsonp({name:"foo"})
    })

    const res = yield supertest(server).get('/?callback=angular').expect(200).expect('Content-type',/javascript/).end()
    expect(res.text).to.match(/typeof angular/)
    done()
  })

  it('should make jsonp response using jsonp default callback when callback is missing in query string', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.jsonp({name:"foo"})
    })

    const res = yield supertest(server).get('/').expect(200).expect('Content-type',/javascript/).end()
    expect(res.text).to.match(/typeof callback/)
    done()
  })


  it('should set request status', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.status(304).json({name:"foo"})
    })
    yield supertest(server).get('/').expect(304).end()
    done()
  })

  it('should download a given file using its path', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.download(path.join(__dirname,'./public/style.css'))
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.text).to.match(/(?:\s*\S+\s*{[^}]*})+/g)
    done()
  })

  it('should force download a given file using its path and by setting content-disposition header', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.attachment(path.join(__dirname,'./public/style.css'))
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['content-disposition']).to.equal('attachment; filename="style.css"')
    done()
  })

  it('should force download a given file using its path but with different name', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.attachment(path.join(__dirname,'./public/style.css'), 'production.css')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['content-disposition']).to.equal('attachment; filename="production.css"')
    done()
  })

  it('should set location header on response', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.location('http://amanvirk.me').send('')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers.location).to.equal('http://amanvirk.me')
    done()
  })

  it('should set location header on response using redirect method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.redirect('http://amanvirk.me')
    })
    const res = yield supertest(server).get('/').expect(302).end()
    expect(res.headers.location).to.equal('http://amanvirk.me')
    done()
  })

  it('should redirect to a given route using route method', function * (done) {
    Route.get('/user/:id', function * () {}).as('profile')
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.route('profile', {id:1})
    })
    const res = yield supertest(server).get('/').expect(302).end()
    expect(res.headers.location).to.equal('/user/1')
    done()
  })

  it('should redirect to a given route using route method when it is under a domain', function * (done) {
    Route.group('g', function () {
      Route.get('/user/:id', function * () {}).as('profile')
    }).domain('virk.adonisjs.com')

    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.route('profile', {id:1})
    })
    const res = yield supertest(server).get('/').expect(302).end()
    expect(res.headers.location).to.equal('virk.adonisjs.com/user/1')
    done()
  })

  it('should add vary field to response headers', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.vary('Accepts').send('')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers.vary).to.equal('Accepts')
    done()
  })

  it('should set response cookie using cookie method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.cookie('name','virk').end()
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name=virk'])
    done()
  })

  it('should make a view using response view method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      co(function * () {
       return yield response.view('index')
      }).then (function (responseView) {
        response.send(responseView)
      }).catch(function (err) {
        response.status(200).send(err)
      })
    })
    try{
      const res = yield supertest(server).get('/').expect(200).end()
      expect(res.text.trim()).to.equal("<h2> Hello world </h2>")
      done()
    }catch(e){
      done(e)
    }
  })

  it('should immediately send a view using response sendView method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      co(function * () {
       yield response.sendView('index')
      }).catch(function (err) {
        response.status(200).send(err)
      })
    })
    try{
      const res = yield supertest(server).get('/').expect(200).end()
      expect(res.text.trim()).to.equal("<h2> Hello world </h2>")
      done()
    }catch(e){
      done(e)
    }
  })

  it('should set X-Powered-By when enabled inside app.http config', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res, Config)
      const response = new this.Response(request, res)
      response.send()
    })
    try{
      const res = yield supertest(server).get('/').expect(200).end()
      expect(res.headers).to.have.property('x-powered-by')
      done()
    }catch(e){
      done(e)
    }
  })

  it('should not set X-Powered-By when not enabled inside app.http config', function * (done) {
    const server = http.createServer((req, res) => {
      const Config = {
        get: function () {
          return false
        }
      }
      const request = new Request(req,res, Config)
      const Response = new ResponseBuilder({}, Route, Config)
      const response = new Response(request, res)
      response.send()
    })
    try{
      const res = yield supertest(server).get('/').expect(200).end()
      expect(res.headers).not.have.property('x-powered-by')
      done()
    }catch(e){
      done(e)
    }
  })

})
