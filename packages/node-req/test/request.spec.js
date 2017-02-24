'use strict'

/*
 * node-req
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const supertest = require('supertest')
const http = require('http')
const pem = require('pem')
const https = require('https')
const test = require('japa')
const Request = require('../')

test.group('Http Request', () => {
  test('should parse http request to return all query string parameters', (assert, done) => {
    assert.plan(1)
    const server = http.createServer((req, res) => {
      const query = Request.get(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(query))
      res.end()
    })

    supertest(server).get('/?name=foo').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body, {name: 'foo'})
      done()
    })
  })

  test('should return an empty object when there is no query string', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const query = Request.get(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(query))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body, {})
      done()
    })
  })

  test('should return request http verb', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const method = Request.method(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({method}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body, {method: 'GET'})
      done()
    })
  })

  test('should return request headers', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const headers = Request.headers(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(headers))
      res.end()
    })

    supertest(server).get('/').set('time', 'now').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.time, 'now')
      done()
    })
  })

  test('should return request referrer header', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referrer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    supertest(server).get('/').set('Referrer', '/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.referrer, '/')
      done()
    })
  })

  test('should return request referrer header when request referrer is using the alternate name', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referrer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    supertest(server).get('/').set('Referer', '/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.referrer, '/')
      done()
    })
  })

  test('should return request referrer header when parameter key is using the alternate name', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    supertest(server).get('/').set('Referrer', '/foo').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.referrer, '/foo')
      done()
    })
  })

  test('should return request single header by its key', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const time = Request.header(req, 'time')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({time}))
      res.end()
    })

    supertest(server).get('/').set('time', 'now').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.time, 'now')
      done()
    })
  })

  test('should check for request freshness', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    supertest(server).get('/').set('if-none-match', '*').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.fresh, true)
      done()
    })
  })

  test('should only check freshness for GET and HEAD requests', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    supertest(server).post('/').set('if-none-match', '*').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.fresh, false)
      done()
    })
  })

  test('should only check freshness if response status is one of the rfc2616 14.26 defined status', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      res.statusCode = 500
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    supertest(server).get('/').set('if-none-match', '*').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.fresh, false)
      done()
    })
  })

  test('should tell whether request is stale or not', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const stale = Request.stale(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({stale}))
      res.end()
    })

    supertest(server).get('/').set('if-none-match', '*').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.stale, false)
      done()
    })
  })

  test('should return request ip address', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ip = Request.ip(req, function (addr) {
        return true
      })
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ip}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.match(res.body.ip, /127\.0\.0\.1/)
      done()
    })
  })

  test('should return all request ip addresses', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ips = Request.ips(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ips}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.ips, [])
      done()
    })
  })

  test('should request protocol', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.protocol, 'http')
      done()
    })
  })

  test('should request X-Forwarded-Proto when trust proxy is enabled', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    supertest(server).get('/').set('X-Forwarded-Proto', 'https').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.protocol, 'https')
      done()
    })
  })

  test('should actual protocol when trust proxy is enabled but X-Forwarded-Proto is missing', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.protocol, 'http')
      done()
    })
  })

  test('should tell whether request is on https or not', (assert, done) => {
    assert.plan(1)

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    pem.createCertificate({days: 1, selfSigned: true}, function (err, keys) {
      const server = https.createServer({key: keys.serviceKey, cert: keys.certificate}, function (req, res) {
        const secure = Request.secure(req)
        if (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end()
          return
        }
        res.writeHead(200, {'content-type': 'application/json'})
        res.write(JSON.stringify({secure}))
        res.end()
      })

      supertest(server).get('/').expect(200).end(function (error, res) {
        if (error) return done(error)
        assert.equal(res.body.secure, true)
        done()
      })
    })
  })

  test('should not return www as subdomain for a given url', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.subdomains, [])
      done()
    })
  })

  test('should return subdomains and should not remove www if not the base subdomain', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers.host = 'virk.www.adonisjs.com'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.subdomains, ['www', 'virk'])
      done()
    })
  })

  test('should return subdomains for a given url and remove www if is the base subdomain', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      req.headers.host = 'www.virk.adonisjs.com'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })
    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.subdomains, ['virk'])
      done()
    })
  })

  test('should return empty array when hostname is an ip address', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers.host = '127.0.0.1'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.subdomains, [])
      done()
    })
  })

  test('should tell whether request is ajax or not', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ajax = Request.ajax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    supertest(server).get('/').set('X-Requested-With', 'xmlhttprequest').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.ajax, true)
      done()
    })
  })

  test('should return false when request does not X-Requested-With header', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ajax = Request.ajax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.ajax, false)
      done()
    })
  })

  test('should tell whether request is pjax or not', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const pjax = Request.pjax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    supertest(server).get('/').set('X-Pjax', true).expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.pjax, true)
      done()
    })
  })

  test('should return false when request does not have X-Pjax header', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const pjax = Request.pjax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.pjax, false)
      done()
    })
  })

  test('should return request hostname', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '127.0.0.1')
      done()
    })
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is defined as a position', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req, 1)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').set('X-Forwarded-Host', '10.0.0.1').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '10.0.0.1')
      done()
    })
  })

  test('should return undefined when unable to get hostname', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').set('Host', '').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, undefined)
      done()
    })
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is enabled', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, 'amanvirk.me')
      done()
    })
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is a function', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, function (addr) {
        return true
      })
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, 'amanvirk.me')
      done()
    })
  })

  test('should return request connection remoteAddress when trust proxy is disabled', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, false)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '127.0.0.1')
      done()
    })
  })

  test('should return request connection X-Forwarded-Host when trust proxy is loopback, since we are on localhost', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, 'loopback')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, 'amanvirk.me')
      done()
    })
  })

  test('should work with ipv6 hostnames', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').set('Host', '[::1]').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '[::1]')
      done()
    })
  })

  test('should work with ipv6 hostnames and port', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').set('Host', '[::1]:3000').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '[::1]')
      done()
    })
  })

  test('should return original host when X-Forwarded-Host is not trusted', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req, '192.168.0.1')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    supertest(server).get('/').set('X-Forwarded-Host', '10.0.0.1').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hostname, '127.0.0.1')
      done()
    })
  })

  test('should return request url without query string or hash', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const url = Request.url(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({url}))
      res.end()
    })

    supertest(server).get('/about?ref=1#20').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.url, '/about')
      done()
    })
  })

  test('should return request original url query string', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const url = Request.originalUrl(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({url}))
      res.end()
    })

    supertest(server).get('/about?ref=1').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.url, '/about?ref=1')
      done()
    })
  })

  test('should return false when request does not accept certain type of content', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const is = Request.is(req, 'html')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({is}))
      res.end()
    })

    supertest(server).get('/').set('Content-type', 'application/json').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.is, false)
      done()
    })
  })

  test('should return the closest matched type', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const is = Request.is(req, ['html', 'json'])
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({is}))
      res.end()
    })

    supertest(server).get('/').set('Content-type', 'text/html').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.is, 'html')
      done()
    })
  })

  test('should tell which content type is accepted based on Accept header', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const html = Request.accepts(req, ['html', 'json'])
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({html}))
      res.end()
    })

    supertest(server).get('/').set('Content-type', 'text/html').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.html, 'html')
      done()
    })
  })

  test('should return list of all content types', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const types = Request.types(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({types}))
      res.end()
    })

    supertest(server).get('/').set('Accept', 'text/html').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.types, ['text/html'])
      done()
    })
  })

  test('should return true when request has body to read', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const hasBody = Request.hasBody(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hasBody}))
      res.end()
    })

    supertest(server).get('/').send('name', 'doe').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hasBody, true)
      done()
    })
  })

  test('should return false when request does not have body to be read', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const hasBody = Request.hasBody(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hasBody}))
      res.end()
    })

    supertest(server).get('/').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.hasBody, false)
      done()
    })
  })

  test('should return the language mentioned in the headers', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const lang = Request.language(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({lang}))
      res.end()
    })

    supertest(server).get('/').set('accept-language', 'en').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.lang, 'en')
      done()
    })
  })

  test('should return all the languages mentioned in the headers', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const languages = Request.languages(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({languages}))
      res.end()
    })

    supertest(server).get('/').set('accept-language', 'en').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.languages, ['en'])
      done()
    })
  })

  test('should return the encoding mentioned in the headers', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const encoding = Request.encoding(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({encoding}))
      res.end()
    })

    supertest(server).get('/').set('accept-encoding', 'gzip').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.equal(res.body.encoding, 'gzip')
      done()
    })
  })

  test('should return all the encoding mentioned in the headers', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const encodings = Request.encodings(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({encodings}))
      res.end()
    })

    supertest(server).get('/').set('accept-encoding', 'gzip').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.encodings, ['gzip', 'identity'])
      done()
    })
  })

  test('should return the charset mentioned in the headers', (assert, done) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const charset = Request.charset(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({charset}))
      res.end()
    })

    supertest(server).get('/').set('accept-charset', 'utf8').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.charset, 'utf8')
      done()
    })
  })

  test('should return the charsets mentioned in the headers', (assert, done) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const charsets = Request.charsets(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({charsets}))
      res.end()
    })

    supertest(server).get('/').set('accept-charset', 'utf8').expect(200).end((error, res) => {
      if (error) return done(error)
      assert.deepEqual(res.body.charsets, ['utf8'])
      done()
    })
  })
})
