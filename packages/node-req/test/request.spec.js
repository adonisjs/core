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
  test('should parse http request to return all query string parameters', async (assert) => {
    assert.plan(1)
    const server = http.createServer((req, res) => {
      const query = Request.get(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(query))
      res.end()
    })

    const res = await supertest(server).get('/?name=foo').expect(200)
    assert.deepEqual(res.body, {name: 'foo'})
  })

  test('should return an empty object when there is no query string', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const query = Request.get(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(query))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body, {})
  })

  test('should return request http verb', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const method = Request.method(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({method}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body, {method: 'GET'})
  })

  test('should return request headers', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const headers = Request.headers(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify(headers))
      res.end()
    })

    const res = await supertest(server).get('/').set('time', 'now').expect(200)
    assert.equal(res.body.time, 'now')
  })

  test('should return request referrer header', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referrer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Referrer', '/').expect(200)
    assert.equal(res.body.referrer, '/')
  })

  test('should return request referrer header when request referrer is using the alternate name', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referrer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Referer', '/').expect(200)
    assert.equal(res.body.referrer, '/')
  })

  test('should return request referrer header when parameter key is using the alternate name', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const referrer = Request.header(req, 'Referer')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({referrer}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Referrer', '/foo').expect(200)
    assert.equal(res.body.referrer, '/foo')
  })

  test('should return request single header by its key', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const time = Request.header(req, 'time')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({time}))
      res.end()
    })

    const res = await supertest(server).get('/').set('time', 'now').expect(200)
    assert.equal(res.body.time, 'now')
  })

  test('should check for request freshness', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = await supertest(server).get('/').set('if-none-match', '*').expect(200)
    assert.equal(res.body.fresh, true)
  })

  test('should only check freshness for GET and HEAD requests', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = await supertest(server).post('/').set('if-none-match', '*').expect(200)
    assert.equal(res.body.fresh, false)
  })

  test('should only check freshness if response status is one of the rfc2616 14.26 defined status', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      res.statusCode = 500
      const fresh = Request.fresh(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({fresh}))
      res.end()
    })

    const res = await supertest(server).get('/').set('if-none-match', '*').expect(200)
    assert.equal(res.body.fresh, false)
  })

  test('should tell whether request is stale or not', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const stale = Request.stale(req, res)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({stale}))
      res.end()
    })

    const res = await supertest(server).get('/').set('if-none-match', '*').expect(200)
    assert.equal(res.body.stale, false)
  })

  test('should return request ip address', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ip = Request.ip(req, function (addr) {
        return true
      })
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ip}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.match(res.body.ip, /127\.0\.0\.1/)
  })

  test('should return all request ip addresses', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ips = Request.ips(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ips}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.ips, [])
  })

  test('should request protocol', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.protocol, 'http')
  })

  test('should request X-Forwarded-Proto when trust proxy is enabled', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-Proto', 'https').expect(200)
    assert.equal(res.body.protocol, 'https')
  })

  test('should actual protocol when trust proxy is enabled but X-Forwarded-Proto is missing', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const protocol = Request.protocol(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({protocol}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.protocol, 'http')
  })

  test('should tell whether request is on https or not', (assert, done) => {
    assert.plan(1)

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
      if (err) {
        throw err
      }

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

      supertest(server).get('/').expect(200).end((error, res) => {
        if (error) return done(error)
        assert.equal(res.body.secure, true)
        done()
      })
    })
  }).timeout(6000)

  test('should not return www as subdomain for a given url', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.subdomains, [])
  })

  test('should return subdomains and should not remove www if not the base subdomain', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers.host = 'virk.www.adonisjs.com'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.subdomains, ['www', 'virk'])
  })

  test('should return subdomains for a given url and remove www if is the base subdomain', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      req.headers.host = 'www.virk.adonisjs.com'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })
    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.subdomains, ['virk'])
  })

  test('should return empty array when hostname is an ip address', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers.host = '127.0.0.1'
      const subdomains = Request.subdomains(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({subdomains}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.subdomains, [])
  })

  test('should tell whether request is ajax or not', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ajax = Request.ajax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Requested-With', 'xmlhttprequest').expect(200)
    assert.equal(res.body.ajax, true)
  })

  test('should return false when request does not X-Requested-With header', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const ajax = Request.ajax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({ajax}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.ajax, false)
  })

  test('should tell whether request is pjax or not', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const pjax = Request.pjax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Pjax', true).expect(200)
    assert.equal(res.body.pjax, true)
  })

  test('should return false when request does not have X-Pjax header', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const pjax = Request.pjax(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({pjax}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.pjax, false)
  })

  test('should return request hostname', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, '127.0.0.1')
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is defined as a position', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req, 1)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-Host', '10.0.0.1').expect(200)
    assert.equal(res.body.hostname, '10.0.0.1')
  })

  test('should return null when unable to get hostname', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Host', '').expect(200)
    assert.equal(res.body.hostname, null)
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is enabled', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, true)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, 'amanvirk.me')
  })

  test('should return request hostname from X-Forwarded-Host when trust proxy is a function', async (assert) => {
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

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, 'amanvirk.me')
  })

  test('should return request connection remoteAddress when trust proxy is disabled', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, false)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, '127.0.0.1')
  })

  test('should return request connection X-Forwarded-Host when trust proxy is loopback, since we are on localhost', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      req.headers['x-forwarded-host'] = 'amanvirk.me'
      const hostname = Request.hostname(req, 'loopback')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, 'amanvirk.me')
  })

  test('should work with ipv6 hostnames', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Host', '[::1]').expect(200)
    assert.equal(res.body.hostname, '[::1]')
  })

  test('should work with ipv6 hostnames and port', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Host', '[::1]:3000').expect(200)
    assert.equal(res.body.hostname, '[::1]')
  })

  test('should return original host when X-Forwarded-Host is not trusted', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const hostname = Request.hostname(req, '192.168.0.1')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hostname}))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-Host', '10.0.0.1').expect(200)
    assert.equal(res.body.hostname, '127.0.0.1')
  })

  test('should return request url without query string or hash', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const url = Request.url(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({url}))
      res.end()
    })

    const res = await supertest(server).get('/about?ref=1#20').expect(200)
    assert.equal(res.body.url, '/about')
  })

  test('should return request original url query string', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const url = Request.originalUrl(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({url}))
      res.end()
    })

    const res = await supertest(server).get('/about?ref=1').expect(200)
    assert.equal(res.body.url, '/about?ref=1')
  })

  test('should return false when request does not accept certain type of content', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const is = Request.is(req, 'html')
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({is}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Content-type', 'application/json').expect(200)
    assert.equal(res.body.is, false)
  })

  test('should return the closest matched type', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const is = Request.is(req, ['html', 'json'])
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({is}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Content-type', 'text/html').expect(200)
    assert.equal(res.body.is, 'html')
  })

  test('should tell which content type is accepted based on Accept header', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const html = Request.accepts(req, ['html', 'json'])
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({html}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Content-type', 'text/html').expect(200)
    assert.equal(res.body.html, 'html')
  })

  test('should return list of all content types', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const types = Request.types(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({types}))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'text/html').expect(200)
    assert.deepEqual(res.body.types, ['text/html'])
  })

  test('should return true when request has body to read', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const hasBody = Request.hasBody(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hasBody}))
      res.end()
    })

    const res = await supertest(server).get('/').send('name', 'doe').expect(200)
    assert.equal(res.body.hasBody, true)
  })

  test('should return false when request does not have body to be read', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const hasBody = Request.hasBody(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({hasBody}))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hasBody, false)
  })

  test('should return the language mentioned in the headers', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const lang = Request.language(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({lang}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-language', 'en').expect(200)
    assert.equal(res.body.lang, 'en')
  })

  test('should return all the languages mentioned in the headers', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const languages = Request.languages(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({languages}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-language', 'en').expect(200)
    assert.deepEqual(res.body.languages, ['en'])
  })

  test('should return the encoding mentioned in the headers', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const encoding = Request.encoding(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({encoding}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-encoding', 'gzip').expect(200)
    assert.equal(res.body.encoding, 'gzip')
  })

  test('should return all the encoding mentioned in the headers', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const encodings = Request.encodings(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({encodings}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-encoding', 'gzip').expect(200)
    assert.deepEqual(res.body.encodings, ['gzip', 'identity'])
  })

  test('should return the charset mentioned in the headers', async (assert) => {
    assert.plan(1)

    const server = http.createServer(function (req, res) {
      const charset = Request.charset(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({charset}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-charset', 'utf8').expect(200)
    assert.deepEqual(res.body.charset, 'utf8')
  })

  test('should return the charsets mentioned in the headers', async (assert) => {
    assert.plan(1)
    const server = http.createServer(function (req, res) {
      const charsets = Request.charsets(req)
      res.writeHead(200, {'content-type': 'application/json'})
      res.write(JSON.stringify({charsets}))
      res.end()
    })

    const res = await supertest(server).get('/').set('accept-charset', 'utf8').expect(200)
    assert.deepEqual(res.body.charsets, ['utf8'])
  })
})
