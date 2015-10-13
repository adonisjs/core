'use strict'

/**
 * node-req
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Request    = require('../src/Request')
const supertest  = require('co-supertest')
const formidable = require('formidable')
const http       = require('http')
const chai       = require('chai')
const expect     = chai.expect

require('co-mocha')

describe('Http Request', function () {

  it('should parse http request to return all query string parameters', function * () {

    const server = http.createServer(function (req,res) {
      const query = Request.get(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify(query))
      res.end()
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body).deep.equal({name:'foo'})

  })

  it('should return an empty object when there is no query string', function * () {

    const server = http.createServer(function (req,res) {
      const query = Request.get(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify(query))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body).deep.equal({})

  })

  it('should return request body when available', function * () {

    const server = http.createServer(function (req,res) {

      var form = new formidable.IncomingForm();

      form.parse(req, function(err, fields, files) {

        req._body = fields

        const body = Request.post(req)
        res.writeHead(200,{"content-type": "application/json"})
        res.write(JSON.stringify(body))
        res.end()
      });

    })

    const res = yield supertest(server).post('/').send({name:'foo'}).expect(200).end()
    expect(res.body).deep.equal({name:'foo'})

  })

  it('should return request http verb', function * () {

    const server = http.createServer(function (req,res) {
      const method = Request.method(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({method}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body).deep.equal({method:'GET'})

  })

  it('should return request headers', function * () {

    const server = http.createServer(function (req,res) {
      const headers = Request.headers(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify(headers))
      res.end()
    })

    const res = yield supertest(server).get('/').set('time','now').expect(200).end()
    expect(res.body.time).to.equal('now')

  })

  it('should return request single header by its key', function * () {

    const server = http.createServer(function (req,res) {
      const time = Request.header(req,'time')
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({time}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('time','now').expect(200).end()
    expect(res.body.time).to.equal('now')

  })

  it('should check for request freshness', function * () {

    const server = http.createServer(function (req,res) {
      const fresh = Request.fresh(req,res)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('if-none-match','*').expect(200).end()
    expect(res.body.fresh).to.equal(true)

  })

  it('should only check freshness for GET and HEAD requests', function * () {

    const server = http.createServer(function (req,res) {
      const fresh = Request.fresh(req,res)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = yield supertest(server).post('/').set('if-none-match','*').expect(200).end()
    expect(res.body.fresh).to.equal(false)

  })

  it('should only check freshness if response status is one of the rfc2616 14.26 defined status', function * () {

    const server = http.createServer(function (req,res) {
      res.statusCode = 500
      const fresh = Request.fresh(req,res)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('if-none-match','*').expect(200).end()
    expect(res.body.fresh).to.equal(false)

  })

  it('should tell whether request is stale or not', function * () {

    const server = http.createServer(function (req,res) {
      const stale = Request.stale(req,res)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({stale}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('if-none-match','*').expect(200).end()
    expect(res.body.stale).to.equal(false)

  })

  it('should return request ip address', function * () {

    const server = http.createServer(function (req,res) {
      const ip = Request.ip(req, function (addr) {
        return true
      })
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({ip}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.ip).to.match(/127\.0\.0\.1/)

  })

  it('should return all request ip addresses', function * () {

    const server = http.createServer(function (req,res) {
      const ip = Request.ips(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({ip}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.ip).to.match(/127\.0\.0\.1/)
  })

  it('should tell whether request is on https or not', function * () {

    const server = http.createServer(function (req,res) {
      const secure = Request.secure(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({secure}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.secure).to.equal(false)
  })

  it('should not return www as subdomain for a given url', function () {

    const req = {
      url: 'http://www.abc.com'
    }
    const subdomains = Request.subdomains(req)
    expect(subdomains).deep.equal([])

  })

  it('should return subdomains and should not remove www if not the base subdomain', function () {

    const req = {
      url: 'http://virk.www.abc.com'
    }
    const subdomains = Request.subdomains(req)
    expect(subdomains).deep.equal(['www','virk'])

  })

  it('should return subdomains for a given url and remove www if is the base subdomain', function () {

    const req = {
      url: 'http://www.virk.abc.com'
    }
    const subdomains = Request.subdomains(req)
    expect(subdomains).deep.equal(['virk'])

  })

  it('should return empty array when hostname is an ip address', function () {

    const req = {
      url: 'http://127.0.0.1'
    }
    const subdomains = Request.subdomains(req)
    expect(subdomains).deep.equal([])

  })

  it('should tell whether request is ajax or not', function * () {

    const server = http.createServer(function (req,res) {
      const ajax = Request.ajax(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('X-Requested-With','xmlhttprequest').expect(200).end()
    expect(res.body.ajax).to.equal(true)

  })

  it('should return false when request does not X-Requested-With header', function * () {

    const server = http.createServer(function (req,res) {
      const ajax = Request.ajax(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.ajax).to.equal(false)

  })

  it('should tell whether request is pjax or not', function * () {

    const server = http.createServer(function (req,res) {
      const pjax = Request.pjax(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('X-Pjax',true).expect(200).end()
    expect(res.body.pjax).to.equal(true)

  })

  it('should return false when request does not have X-Pjax header', function * () {

    const server = http.createServer(function (req,res) {
      const pjax = Request.pjax(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.pjax).to.equal(false)

  })

  it('should return request hostname', function * () {

    const server = http.createServer(function (req,res) {
      const hostname = Request.hostname(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.hostname).to.equal(null)

  })

  it('should return request url without query string or hash', function * () {

    const server = http.createServer(function (req,res) {
      const url = Request.url(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({url}))
      res.end()
    })

    const res = yield supertest(server).get('/about?ref=1#20').expect(200).end()
    expect(res.body.url).to.equal('/about')

  })

  it('should return request original url query string', function * () {

    const server = http.createServer(function (req,res) {
      const url = Request.originalUrl(req)
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({url}))
      res.end()
    })

    const res = yield supertest(server).get('/about?ref=1').expect(200).end()
    expect(res.body.url).to.equal('/about?ref=1')

  })

  it('should return false when request does not accept certain type of content', function * () {

    const server = http.createServer(function (req,res) {
      const is = Request.is(req,'html')
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({is}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Content-type','application/json').expect(200).end()
    expect(res.body.is).to.equal(false)

  })


  it('should return true when request accept any one type of content', function * () {

    const server = http.createServer(function (req,res) {
      const is = Request.is(req,['html','json'])
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({is}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Content-type','text/html').expect(200).end()
    expect(res.body.is).to.equal(true)

  })

  it('should tell which content type is accepted based on Accept header', function * () {

    const server = http.createServer(function (req,res) {
      const html = Request.accepts(req,['html','json'])
      res.writeHead(200,{"content-type": "application/json"})
      res.write(JSON.stringify({html}))
      res.end()
    })

    const res = yield supertest(server).get('/').set('Content-type','text/html').expect(200).end()
    expect(res.body.html).to.equal('html')

  })

})
