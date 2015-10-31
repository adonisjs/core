'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
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

describe('Response', function () {

  before(function () {
    const Helpers = {
      viewsPath: function () {
        return path.join(__dirname,'./app/views')
      }
    }

    const Env = {
      get: function () {
        return true
      }
    }
    const view = new View(Helpers, Env, Route)
    this.Response = new ResponseBuilder(view,Route)
  })

  it('should respond to a request using send method', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.send("Hello world")
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.text).to.equal("Hello world")
    done()
  })

  it('should set header on response', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.header("country","India").send('')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['country']).to.equal("India")
    done()
  })

  it('should remove existing from request', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.removeHeader("country","India").send('')
    })

    const res = yield supertest(server).get('/').set('country','India').expect(200).end()
    expect(res.headers['country']).to.equal(undefined)
    done()

  })

  it('should make json response using json method', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.json({name:"foo"})
    })

    const res = yield supertest(server).get('/').expect(200).expect('Content-type',/json/).end()
    expect(res.body).deep.equal({name:"foo"})
    done()
  })

  it('should make jsonp response using jsonp method with correct callback', function * (done) {

    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.jsonp({name:"foo"})
    })

    const res = yield supertest(server).get('/?callback=angular').expect(200).expect('Content-type',/javascript/).end()
    expect(res.text).to.match(/typeof angular/)
    done()
  })

  it('should set request status', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.status(304).json({name:"foo"})
    })
    const res = yield supertest(server).get('/').expect(304).end()
    done()
  })

  it('should download a given file using its path', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.download(path.join(__dirname,'./public/style.css'))
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.text).to.match(/(?:\s*\S+\s*{[^}]*})+/g)
    done()
  })

  it('should force download a given file using its path and by setting content-disposition header', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.attachment(path.join(__dirname,'./public/style.css'))
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['content-disposition']).to.equal('attachment; filename="style.css"')
    done()
  })

  it('should force download a given file using its path but with different name', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.attachment(path.join(__dirname,'./public/style.css'), 'production.css')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['content-disposition']).to.equal('attachment; filename="production.css"')
    done()
  })

  it('should set location header on response', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.location('http://amanvirk.me').send('')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['location']).to.equal('http://amanvirk.me')
    done()
  })

  it('should set location header on response using redirect method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.redirect('http://amanvirk.me')
    })
    const res = yield supertest(server).get('/').expect(302).end()
    expect(res.headers['location']).to.equal('http://amanvirk.me')
    done()
  })

  it('should redirect to a given route using route method', function * (done) {
    Route.get('/user/:id', function * () {}).as('profile')
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.route('profile', {id:1})
    })
    const res = yield supertest(server).get('/').expect(302).end()
    expect(res.headers['location']).to.equal('/user/1')
    done()
  })

  it('should add vary field to response headers', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.vary('Accepts').send('')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['vary']).to.equal('Accepts')
    done()
  })

  it('should set response cookie using cookie method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      response.cookie('name','virk').end()
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.headers['set-cookie']).deep.equal(['name=virk'])
    done()
  })

  it('should make a view using response view method', function * (done) {
    const server = http.createServer((req, res) => {
      const request = new Request(req,res)
      const response = new this.Response(request, res)
      co(function * () {
       return yield response.view('index')
      }).then (function (responseView) {
        response.send(responseView)
      }).catch(function (err) {
        console.log(err)
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

})
