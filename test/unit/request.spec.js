'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Request = require('../../src/Request')
const http = require('http')
const File = require('../../src/File')
const https = require('https')
const supertest = require('co-supertest')
const path = require('path')
const pem = require('pem')
const formidable = require('formidable')

const Config = {
  get: function (key) {
    switch (key) {
      case 'http.trustProxy':
        return true
      case 'app.appKey':
        return null
      default:
        return 2
    }
  }
}

require('co-mocha')

describe('Request', function () {
  it('should get request query string', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const query = request.get()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({query}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({name: 'foo'})
  })

  it('should return empty object when request does not have query string', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const query = request.get()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({query}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({})
  })

  it('should get request post data', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {name: 'foo'}
      const body = request.post()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({body}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({name: 'foo'})
  })

  it('should return empty object when post body does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const body = request.post()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({body}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({})
  })

  it('should get value for a given key using input method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input('name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.name).to.equal('foo')
  })

  it('should return null when value for input key is not available', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input('name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.name).to.equal(null)
  })

  it('should get nested value for a given key using input method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input('profile.name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/?profile[name]=foo').expect(200).end()
    expect(res.body.name).to.equal('foo')
  })

  it('should return default value when value for input key is not available', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input('name', 'doe')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.name).to.equal('doe')
  })

  it('should return get and post values when using all', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.all()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({name: 'foo', age: 22})
  })

  it('should group and return an array of items', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {username: ['virk', 'aman', 'nikk'], email: ['virk@gmail.com', 'aman@gmail.com', 'nikk@gmail.com']}
      const contacts = request.collect('username', 'email')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({contacts}), 'utf8')
    })
    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.contacts).deep.equal([{username: 'virk', email: 'virk@gmail.com'}, {username: 'aman', email: 'aman@gmail.com'}, {username: 'nikk', email: 'nikk@gmail.com'}])
  })

  it('should group and return null for fields not present inside the object', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {username: ['virk', 'aman', 'nikk']}
      const contacts = request.collect('username', 'age')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({contacts}), 'utf8')
    })
    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.contacts).deep.equal([{username: 'virk', age: null}, {username: 'aman', age: null}, {username: 'nikk', age: null}])
  })

  it('should group and return null for fields not present inside the object at different order', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {username: ['virk', 'aman', 'nikk'], email: ['virk@foo.com', 'aman@foo.com', 'nikk@foo.com']}
      const contacts = request.collect('name', 'email')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({contacts}), 'utf8')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.contacts).deep.equal([{name: null, email: 'virk@foo.com'}, {name: null, email: 'aman@foo.com'}, {name: null, email: 'nikk@foo.com'}])
  })

  it('should group and return null for fields not present inside the object in mix order', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {username: ['virk', 'aman', 'nikk'], email: ['virk@foo.com', 'aman@foo.com', 'nikk@foo.com'], password: ['vi', 'am', 'ni']}
      const contacts = request.collect('password', 'name', 'username')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({contacts}), 'utf8')
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.contacts).deep.equal([{password: 'vi', name: null, username: 'virk'}, {password: 'am', name: null, username: 'aman'}, {password: 'ni', name: null, username: 'nikk'}])
  })

  it('should return all values expect defined keys', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.except('age')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({name: 'foo'})
  })

  it('should return all values expect defined keys when defined as an array', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.except(['age'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({name: 'foo'})
  })

  it('should not return key/value pair for key that does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.except(['foo'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({name: 'foo', age: 22})
  })

  it('should return all values for only defined keys', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.only('age')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({age: 22})
  })

  it('should return all values for only defined keys when keys are defined as array', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.only(['age'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({age: 22})
  })

  it('should not return key/value pair for key that does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._body = {age: 22}
      const all = request.only(['foo'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({all}), 'utf8')
    })

    const res = yield supertest(server).get('/?name=foo').expect(200).end()
    expect(res.body.all).deep.equal({})
  })

  it('should return all headers for a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const headers = request.headers()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({headers}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('username', 'admin').expect(200).end()
    expect(res.body.headers).to.have.property('username')
    expect(res.body.headers.username).to.equal('admin')
  })

  it('should return header value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const username = request.header('username')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({username}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('username', 'admin').expect(200).end()
    expect(res.body.username).to.equal('admin')
  })

  it('should check for request freshness', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const fresh = request.fresh()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({fresh}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('if-none-match', '*').expect(200).end()
    expect(res.body.fresh).to.equal(true)
  })

  it('should tell whether request is stale or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const stale = request.stale()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({stale}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('if-none-match', '*').expect(200).end()
    expect(res.body.stale).to.equal(false)
  })

  it('should return best match for request ip address', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ip = request.ip()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({ip}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.ip).to.match(/127\.0\.0\.1/)
  })

  it('should return all ip addresses from a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ips = request.ips()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({ips}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.ips).to.be.an('array')
  })

  it('should tell whether request is https or not', function (done) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    pem.createCertificate({days: 1, selfSigned: true}, function (err, keys) {
      if (err) { done(err) }
      const server = https.createServer({key: keys.serviceKey, cert: keys.certificate}, function (req, res) {
        const request = new Request(req, res, Config)
        const secure = request.secure()
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({secure}), 'utf8')
      })

      supertest(server)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            done(err)
            return
          }
          expect(res.body.secure).to.equal(true)
          server.close()
          done()
        })
    })
  })

  it('should return request subdomains', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const subdomains = request.subdomains()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({subdomains}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('X-Forwarded-Host', 'virk.adonisjs.com').expect(200).end()
    expect(res.body.subdomains).deep.equal(['virk'])
  })

  it('should tell whether request is ajax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ajax = request.ajax()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({ajax}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('X-Requested-With', 'xmlhttprequest').expect(200).end()
    expect(res.body.ajax).to.equal(true)
  })

  it('should tell whether request is pjax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const pjax = request.pjax()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({pjax}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('X-PJAX', true).expect(200).end()
    expect(res.body.pjax).to.equal(true)
  })

  it('should return request host name', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const hostname = request.hostname()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({hostname}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.hostname).to.equal('127.0.0.1')
  })

  it('should return request url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const url = request.url()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({url}), 'utf8')
    })

    const res = yield supertest(server).get('/?query=string').expect(200).end()
    expect(res.body.url).to.equal('/')
  })

  it('should return request original url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const originalUrl = request.originalUrl()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({originalUrl}), 'utf8')
    })

    const res = yield supertest(server).get('/?query=string').expect(200).end()
    expect(res.body.originalUrl).to.equal('/?query=string')
  })

  it('should return request method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const method = request.method()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({method}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.method).to.equal('GET')
  })

  it('should tell whether request is of certain type', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is('html')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({isHtml}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Content-type', 'text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell whether request is of certain type when an array of options have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is(['json', 'html'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({isHtml}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Content-type', 'text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell whether request is of certain type when multiple arguments have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is('json', 'javascript', 'html')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({isHtml}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Content-type', 'text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell best response type request will accept', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts('html')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({html}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept', 'text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should tell best response type request will accept when an array of options have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts(['json', 'html'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({html}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept', 'text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should tell best response type request will accept when multiple arguments have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts('json', 'javascript', 'html')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({html}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept', 'text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should return request cookies', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const cookies = request.cookies()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({cookies}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name: 'foo'})
  })

  it('should not reparse cookies after calling cookies method multiple times', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request.cookies()
      request.cookiesObject.age = 22
      const cookiesAgain = request.cookies()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({cookies: cookiesAgain}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name: 'foo', age: 22})
  })

  it('should return cookie value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.cookie('name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.name).to.equal('foo')
  })

  it('should return null when cookie value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const age = request.cookie('age')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({age}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.age).to.equal(null)
  })

  it('should return default value when cookie value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const age = request.cookie('age', 18)
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({age}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.age).to.equal(18)
  })

  it('should return plain cookies even when encryption is on', function * () {
    const server = http.createServer(function (req, res) {
      const alternateConfig = {
        get: function (key) {
          switch (key) {
            case 'app.appKey':
              return 'n96M1TPG821EdN4mMIjnGKxGytx9W2UJ'
          }
        }
      }
      const request = new Request(req, res, alternateConfig)
      const cookies = request.cookies()
      const plainCookies = request.plainCookies()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({cookies, plainCookies}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({})
    expect(res.body.plainCookies).deep.equal({name: 'foo'})
  })

  it('should return value for a given key from plain cookies even when encryption is on', function * () {
    const server = http.createServer(function (req, res) {
      const alternateConfig = {
        get: function (key) {
          switch (key) {
            case 'app.appKey':
              return 'n96M1TPG821EdN4mMIjnGKxGytx9W2UJ'
          }
        }
      }
      const request = new Request(req, res, alternateConfig)
      const name = request.cookie('name')
      const plainName = request.plainCookie('name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name, plainName}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Cookie', ['name=bar']).expect(200).end()
    expect(res.body.name).to.equal(null)
    expect(res.body.plainName).to.equal('bar')
  })

  it('should return route params', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id: 1}
      const params = request.params()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({params}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.params).deep.equal({id: 1})
  })

  it('should return empty object when request params does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const params = request.params()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({params}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.params).deep.equal({})
  })

  it('should return request param value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id: 1}
      const id = request.param('id')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({id}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.id).to.equal(1)
  })

  it('should return null when param value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id: 1}
      const name = request.param('name')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.name).to.equal(null)
  })

  it('should return default value when param value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id: 1}
      const name = request.param('name', 'bar')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({name}), 'utf8')
    })

    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.name).to.equal('bar')
  })

  it('should return an uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm()
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({file: file instanceof File}), 'utf8')
      })
    })
    const res = yield supertest(server).get('/').attach('logo', path.join(__dirname, '/uploads/npm-logo.svg')).expect(200).end()
    expect(res.body.file).to.equal(true)
  })

  it('should return an array of uploaded files instances when multiple files are uploaded', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm({multiples: true})
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const logos = request.file('logo[]')
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({logo1: logos[0] instanceof File, logo2: logos[1] instanceof File}), 'utf8')
      })
    })
    const res = yield supertest(server).get('/')
      .attach('logo[]', path.join(__dirname, '/uploads/npm-logo.svg'))
      .attach('logo[]', path.join(__dirname, '/uploads/npm-logo.svg'))
      .expect(200)
      .end()

    expect(res.body.logo1).to.equal(true)
    expect(res.body.logo2).to.equal(true)
  })

  it('should be able to define max size for a given file', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm({multiples: true})
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const logo = request.file('logo', {maxSize: '1kb'})
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({logo: logo.toJSON()}), 'utf8')
      })
    })

    const res = yield supertest(server).get('/')
      .attach('logo', path.join(__dirname, '/uploads/npm-logo.svg'))
      .expect(200)
      .end()
    expect(res.body.logo.maxSize).to.equal(1024)
  })

  it('should be able to define allowed extensions for a given file', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm({multiples: true})
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const logo = request.file('logo', {allowedExtensions: ['jpg']})
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({logo: logo.toJSON()}), 'utf8')
      })
    })

    const res = yield supertest(server).get('/')
      .attach('logo', path.join(__dirname, '/uploads/npm-logo.svg'))
      .expect(200)
      .end()
    expect(res.body.logo.allowedExtensions).deep.equal(['jpg'])
  })

  it('should return error when trying to move a file of larger size', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm({multiples: true})
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const logo = request.file('logo', {maxSize: '100b'})
        logo
          .move()
          .then(() => {
            res.writeHead(200, {'Content-type': 'application/json'})
            res.end(JSON.stringify({logo: logo.toJSON()}), 'utf8')
          })
      })
    })

    const res = yield supertest(server).get('/')
      .attach('logo', path.join(__dirname, '/uploads/npm-logo.svg'))
      .expect(200)
      .end()
    expect(res.body.logo.error).to.equal('Uploaded file size 235B exceeds the limit of 100B')
  })

  it('should return error when trying to move a file of invalid extension', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm({multiples: true})
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const logo = request.file('logo', {allowedExtensions: ['jpg']})
        logo
          .move()
          .then(() => {
            res.writeHead(200, {'Content-type': 'application/json'})
            res.end(JSON.stringify({logo: logo.toJSON()}), 'utf8')
          })
      })
    })

    const res = yield supertest(server).get('/')
      .attach('logo', path.join(__dirname, '/uploads/npm-logo.svg'))
      .expect(200)
      .end()
    expect(res.body.logo.error).to.equal('Uploaded file extension svg is not valid')
  })

  it('should return true when a pattern matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user/:id/profile')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when a pattern does not matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return true when any of the paths inside array matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match(['/user', '/user/1/profile'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })
    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when none of the paths inside array matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match(['/user', '/user/1', '/1/profile'])
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })
    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return true when any of the paths from any of the arguments matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user', '/user/1/profile')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when any of the paths from any of the arguments does not matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user', '/user/1', '/user/profile')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({matches}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return false when request does not have body', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const hasBody = request.hasBody()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({hasBody}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.hasBody).to.equal(false)
  })

  it('should return true when request has body', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const hasBody = request.hasBody()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({hasBody}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').send('name', 'doe').expect(200).end()
    expect(res.body.hasBody).to.equal(true)
  })

  it('should return request format using format method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {format: '.json'}
      const format = request.format()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({format}), 'utf8')
    })

    const res = yield supertest(server).get('/user/1/profile').expect(200).end()
    expect(res.body.format).to.equal('json')
  })

  it('should return an null when file is not uploaded', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm()
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({file}), 'utf8')
      })
    })
    const res = yield supertest(server).get('/').expect(200).end()
    expect(res.body.file).to.equal(null)
  })

  it('should return all uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm()
      const request = new Request(req, res, Config)
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.writeHead(500, {'Content-type': 'application/json'})
          res.send(JSON.stringify({error: err.message}))
          return
        }
        request._files = files
        const allFiles = request.files()
        const isInstances = []
        allFiles.forEach(function (file) {
          isInstances.push(file instanceof File)
        })
        res.writeHead(200, {'Content-type': 'application/json'})
        res.end(JSON.stringify({isInstances}), 'utf8')
      })
    })
    const res = yield supertest(server).get('/').attach('logo', path.join(__dirname, '/uploads/npm-logo.svg')).attach('favicon', path.join(__dirname, '/public/favicon.ico')).expect(200).end()
    expect(res.body.isInstances).deep.equal([true, true])
  })

  it('should be able to add macro to the request prototype', function () {
    Request.macro('foo', function () {
      return 'foo'
    })
    const request = new Request({}, {}, {get: function () {}})
    expect(request.foo()).to.equal('foo')
  })

  it('should be able to get request language', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const language = request.language()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({language}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Language', 'en').expect(200).end()
    expect(res.body.language).to.equal('en')
  })

  it('should be able to get the list of request languages', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const languages = request.languages()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({languages}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Language', 'en').expect(200).end()
    expect(res.body.languages).deep.equal(['en'])
  })

  it('should be able to get request encoding', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const encoding = request.encoding()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({encoding}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Encoding', 'gzip').expect(200).end()
    expect(res.body.encoding).to.equal('gzip')
  })

  it('should be able to list of get request encodings', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const encodings = request.encodings()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({encodings}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Encoding', 'gzip').expect(200).end()
    expect(res.body.encodings).deep.equal(['gzip', 'identity'])
  })

  it('should be able to get request charset', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const charset = request.charset()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({charset}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Charset', 'utf8').expect(200).end()
    expect(res.body.charset).to.equal('utf8')
  })

  it('should be able to get list of request charsets', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const charsets = request.charsets()
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({charsets}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Charset', 'utf8').expect(200).end()
    expect(res.body.charsets).deep.equal(['utf8'])
  })

  it('should return the partially allowed language', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const language = request.language('en')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({language}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Language', 'en-us, en-uk').expect(200).end()
    expect(res.body.language).to.equal('en')
  })

  it('should return false when partially allowed language is not allowed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const language = request.language('fr')
      res.writeHead(200, {'Content-type': 'application/json'})
      res.end(JSON.stringify({language}), 'utf8')
    })

    const res = yield supertest(server).get('/').set('Accept-Language', 'en-us, en-uk').expect(200).end()
    expect(res.body.language).to.equal(false)
  })
})
