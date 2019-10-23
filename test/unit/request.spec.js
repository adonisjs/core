'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const http = require('http')
const supertest = require('supertest')
const simpleEncryptor = require('simple-encryptor')
const sig = require('cookie-signature')
const { Config } = require('@adonisjs/sink')
const Request = require('../../src/Request')

const SECRET = 'averylongsecretkey'
/**
 * Setting up config provider to be used
 * for testing.
 */
const config = new Config()
config.set('app.appKey', SECRET)
config.set('app.http.subdomainOffset', 2)
config.set('app.http.allowMethodSpoofing', true)

test.group('Request', () => {
  test('return query params from url', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const params = request.get()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ params }))
      res.end()
    })

    const res = await supertest(server).get('/?username=virk&age=22').expect(200)
    assert.deepEqual(res.body.params, { username: 'virk', age: '22' })
  })

  test('return nested query params from url', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const params = request.get()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ params }))
      res.end()
    })

    const res = await supertest(server).get('/?username[0]=virk&age=22').expect(200)
    assert.deepEqual(res.body.params, { username: ['virk'], age: '22' })
  })

  test('return http method', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const method = request.method()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ method }))
      res.end()
    })

    const res = await supertest(server).post('/').expect(200)
    assert.equal(res.body.method, 'POST')
  })

  test('return http headers', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const headers = request.headers()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ headers }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'json,html').expect(200)
    assert.property(res.body.headers, 'accept')
    assert.equal(res.body.headers.accept, 'json,html')
  })

  test('return value for a given key from headers', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const accept = request.header('accept')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ accept }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'json,html').expect(200)
    assert.equal(res.body.accept, 'json,html')
  })

  test('return default value when value doesn\'t exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const accept = request.header('accept', 'json')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ accept }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.accept, 'json')
  })

  test('return ip address for the request', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const ip = request.ip()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ ip }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.ip, '::ffff:127.0.0.1')
  })

  test('given priority to X-forwarded header when trust is set to true', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const ip = request.ip(true)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ ip }))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-For', '127.0.0.1').expect(200)
    assert.equal(res.body.ip, '127.0.0.1')
  })

  test('return request protocol', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const protocol = request.protocol()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ protocol }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.protocol, 'http')
  })

  test('return false when request is not over https', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const secure = request.secure()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ secure }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.secure, false)
  })

  test('return empty array when no subdomains are defined', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const subdomains = request.subdomains()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ subdomains }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body.subdomains, [])
  })

  test('return array of subdomains', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const subdomains = request.subdomains()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ subdomains }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Host', 'foo.bar.com').expect(200)
    assert.deepEqual(res.body.subdomains, ['foo'])
  })

  test('exclude www from array of subdomains', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const subdomains = request.subdomains()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ subdomains }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Host', 'www.bar.com').expect(200)
    assert.deepEqual(res.body.subdomains, [])
  })

  test('return true from ajax() when request x-requested-with is set to XMLHttpRequest', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const ajax = request.ajax()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ ajax }))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Requested-With', 'XMLHttpRequest').expect(200)
    assert.equal(res.body.ajax, true)
  })

  test('return true from pjax() when X-PJAX header is present', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const pjax = request.pjax()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ pjax }))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-PJAX', true).expect(200)
    assert.equal(res.body.pjax, true)
  })

  test('return hostname for the request', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const hostname = request.hostname()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ hostname }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hostname, '127.0.0.1')
  })

  test('return hostname from X-Forwarded-Host when trust is set to true', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const hostname = request.hostname(true)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ hostname }))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-Host', 'localhost').expect(200)
    assert.equal(res.body.hostname, 'localhost')
  })

  test('return original host when trust is set to false', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const hostname = request.hostname(false)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ hostname }))
      res.end()
    })

    const res = await supertest(server).get('/').set('X-Forwarded-Host', 'localhost').expect(200)
    assert.equal(res.body.hostname, '127.0.0.1')
  })

  test('return request url without query string', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const url = request.url()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ url }))
      res.end()
    })

    const res = await supertest(server).get('/?name=virk').expect(200)
    assert.equal(res.body.url, '/')
  })

  test('return request original url', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const url = request.originalUrl()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ url }))
      res.end()
    })

    const res = await supertest(server).get('/?name=virk').expect(200)
    assert.equal(res.body.url, '/?name=virk')
  })

  test('return valid content type for a given request', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const contentType = request.is(['json', 'html'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ contentType }))
      res.end()
    })

    const res = await supertest(server).post('/')
      .set('content-type', 'application/json')
      .send({ username: 'virk' })
      .expect(200)
    assert.equal(res.body.contentType, 'json')
  })

  test('return empty string content-type does not matches', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const contentType = request.is(['xml', 'html'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ contentType }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Content-type', 'application/json').expect(200)
    assert.equal(res.body.contentType, '')
  })

  test('return the best matching response type based on Accept header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const acceptType = request.accepts(['html', 'json'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ acceptType }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'application/json').expect(200)
    assert.equal(res.body.acceptType, 'json')
  })

  test('return empty string when nothing matches in accept type', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const acceptType = request.accepts(['html', 'xml'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ acceptType }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'application/json').expect(200)
    assert.equal(res.body.acceptType, '')
  })

  test('return actual accept header as array when types are not defined', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const acceptType = request.accepts()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ acceptType }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept', 'application/json').expect(200)
    assert.deepEqual(res.body.acceptType, ['application/json'])
  })

  test('return null for cookies which are not encrypted', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const cookies = request.cookies()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ cookies }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', 'age=22').expect(200)
    assert.deepEqual(res.body.cookies, { age: null })
  })

  test('unsign and decrypt cookies when they are encrypted', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const cookies = request.cookies()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ cookies }))
      res.end()
    })

    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })
    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', `age=${encrypter.encrypt(age)}`).expect(200)
    assert.deepEqual(res.body.cookies, { age: '22' })
  })

  test('return actual cookie value when plainCookies method is used', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const cookies = request.plainCookies()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ cookies }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', 'age=22').expect(200)
    assert.deepEqual(res.body.cookies, { age: '22' })
  })

  test('return null for cookie key which is not encrypted', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const age = request.cookie('age')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ age }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', 'age=22').expect(200)
    assert.equal(res.body.age, null)
  })

  test('unsign and decrypt cookie for a given key when it is encrypted', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const age = request.cookie('age')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ age }))
      res.end()
    })

    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })
    const age = `s:${sig.sign('22', SECRET)}`
    const res = await supertest(server).get('/').set('Cookie', `age=${encrypter.encrypt(age)}`).expect(200)
    assert.equal(res.body.age, '22')
  })

  test('return actual value for cookie using plainCookie method', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const age = request.plainCookie('age')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ age }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Cookie', 'age=22').expect(200)
    assert.equal(res.body.age, '22')
  })

  test('return preferrable language based upon Accept-Language header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const language = request.language(['fr', 'en-us'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ language }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Language', 'en').expect(200)
    assert.equal(res.body.language, 'en-us')
  })

  test('return array of languages based upon Accept-Language header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const languages = request.languages()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ languages }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Language', 'en, en-us').expect(200)
    assert.deepEqual(res.body.languages, ['en', 'en-us'])
  })

  test('return preferred encoding based upon Accept-Encoding header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const encoding = request.encoding(['gzip'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ encoding }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Encoding', 'gzip, compress').expect(200)
    assert.equal(res.body.encoding, 'gzip')
  })

  test('return an array of encodings based upon Accept-Encoding header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const encodings = request.encodings()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ encodings }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Encoding', 'compress').expect(200)
    assert.deepEqual(res.body.encodings, ['compress', 'identity'])
  })

  test('return preferred charset based upon Accept-Charset header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const charset = request.charset(['utf-8'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ charset }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Charset', 'utf-8, ascii').expect(200)
    assert.equal(res.body.charset, 'utf-8')
  })

  test('return an array of charsets based upon Accept-Charset header', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const charsets = request.charsets()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ charsets }))
      res.end()
    })

    const res = await supertest(server).get('/').set('Accept-Charset', 'utf-8, ascii').expect(200)
    assert.deepEqual(res.body.charsets, ['utf-8', 'ascii'])
  })

  test('return false for hasBody when request does not contain any body', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const hasBody = request.hasBody()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ hasBody }))
      res.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.equal(res.body.hasBody, false)
  })

  test('return true for hasBody when request contain body', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const hasBody = request.hasBody()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ hasBody }))
      res.end()
    })

    const res = await supertest(server).post('/').send('username', 'virk').expect(200)
    assert.equal(res.body.hasBody, true)
  })

  test('return request body and query string', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      request.body = { username: 'virk' }
      const all = request.all()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ all }))
      res.end()
    })

    const res = await supertest(server).post('/?age=22').send('username', 'virk').expect(200)
    assert.deepEqual(res.body.all, { age: '22', username: 'virk' })
  })

  test('return value for a given key', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const age = request.input('age')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ age }))
      res.end()
    })

    const res = await supertest(server).post('/?age=22').expect(200)
    assert.equal(res.body.age, '22')
  })

  test('return default value when value does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const username = request.input('username', 'virk')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ username }))
      res.end()
    })

    const res = await supertest(server).post('/').expect(200)
    assert.equal(res.body.username, 'virk')
  })

  test('return request values except the given keys', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const data = request.except(['age', 'terms'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ data }))
      res.end()
    })

    const res = await supertest(server).post('/?age=22&terms=accepted&username=virk').expect(200)
    assert.deepEqual(res.body.data, { username: 'virk' })
  })

  test('return request values only for the given keys', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const data = request.only(['age', 'terms'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ data }))
      res.end()
    })

    const res = await supertest(server).post('/?age=22&terms=accepted&username=virk').expect(200)
    assert.deepEqual(res.body.data, { age: '22', terms: 'accepted' })
  })

  test('return true when request url matches a given route pattern', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const matches = request.match(['/users/(.+)'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ matches }))
      res.end()
    })

    const res = await supertest(server).get('/users/1/profile').expect(200)
    assert.equal(res.body.matches, true)
  })

  test('return false when request url doesn\'t matches a given route pattern', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const matches = request.match(['/users/(\\d)'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ matches }))
      res.end()
    })

    const res = await supertest(server).get('/users/1/profile').expect(200)
    assert.equal(res.body.matches, false)
  })

  test('return false when matches array is empty', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const matches = request.match([])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ matches }))
      res.end()
    })

    const res = await supertest(server).get('/users/1/profile').expect(200)
    assert.equal(res.body.matches, false)
  })

  test('return spoofed method over the original HTTP method', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const method = request.method()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ method }))
      res.end()
    })

    const res = await supertest(server).post('/user?_method=put').expect(200)
    assert.equal(res.body.method, 'PUT')
  })

  test('return original method even when spoofed HTTP method exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      const method = request.intended()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ method }))
      res.end()
    })

    const res = await supertest(server).post('/user?_method=PUT').expect(200)
    assert.equal(res.body.method, 'POST')
  })

  test('group and return an array of values', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)

      request.body = {
        username: ['virk', 'aman', 'nikk'],
        email: ['virk@gmail.com', 'aman@gmail.com', 'nikk@gmail.com']
      }

      const users = request.collect(['username', 'email'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ users }))
      res.end()
    })

    const res = await supertest(server).get('/user').expect(200)
    assert.deepEqual(res.body.users, [
      { username: 'virk', email: 'virk@gmail.com' },
      { username: 'aman', email: 'aman@gmail.com' },
      { username: 'nikk', email: 'nikk@gmail.com' }
    ])
  })

  test('set all values to null when it does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)

      request.body = {
        username: ['virk', 'aman', 'nikk']
      }

      const users = request.collect(['username', 'email'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ users }))
      res.end()
    })

    const res = await supertest(server).get('/user').expect(200)
    assert.deepEqual(res.body.users, [
      { username: 'virk', email: null },
      { username: 'aman', email: null },
      { username: 'nikk', email: null }
    ])
  })

  test('set value for a position to null when array is dis-balanced', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)

      request.body = {
        username: ['virk', 'aman', 'nikk'],
        email: ['virk@gmail.com', 'aman@gmail.com']
      }

      const users = request.collect(['username', 'email'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ users }))
      res.end()
    })

    const res = await supertest(server).get('/user').expect(200)
    assert.deepEqual(res.body.users, [
      { username: 'virk', email: 'virk@gmail.com' },
      { username: 'aman', email: 'aman@gmail.com' },
      { username: 'nikk', email: null }
    ])
  })

  test('set value for a position to null when value does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)

      request.body = {
        username: ['virk', 'aman', 'nikk'],
        email: ['virk@gmail.com', '', 'nikk@gmail.com']
      }

      const users = request.collect(['username', 'email'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ users }))
      res.end()
    })

    const res = await supertest(server).get('/user').expect(200)
    assert.deepEqual(res.body.users, [
      { username: 'virk', email: 'virk@gmail.com' },
      { username: 'aman', email: null },
      { username: 'nikk', email: 'nikk@gmail.com' }
    ])
  })

  test('handle situations when value is string and not an array', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)

      request.body = {
        username: 'virk',
        email: ['virk@gmail.com', '', 'nikk@gmail.com']
      }

      const users = request.collect(['username', 'email'])
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ users }))
      res.end()
    })

    const res = await supertest(server).get('/user').expect(200)
    assert.deepEqual(res.body.users, [
      { username: 'virk', email: 'virk@gmail.com' },
      { username: null, email: null },
      { username: null, email: 'nikk@gmail.com' }
    ])
  })

  test('do not mutate get and post', async (assert) => {
    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      request._body = { username: 'virk' }
      const all = request.all()
      all.age = 24
      all.username = 'nikk'
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write(JSON.stringify({ get: request.get(), post: request.post() }))
      res.end()
    })

    const res = await supertest(server).post('/?age=22').send('username', 'virk').expect(200)
    assert.deepEqual(res.body.get, { age: '22' })
    assert.deepEqual(res.body.post, { username: 'virk' })
  })

  test('keep a copy of request original data on each request', async (assert) => {
    assert.plan(1)

    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      request.body = { username: 'virk' }
      assert.deepEqual(request.all(), request.original())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end()
    })

    await supertest(server).post('/').send('username', 'virk').expect(200)
  })

  test('seal request original after body is set once', async (assert) => {
    assert.plan(3)

    const server = http.createServer((req, res) => {
      const request = new Request(req, res, config)
      request.body = { username: 'virk' }
      request.body = { username: 'nikk' }
      assert.deepEqual(request.all(), { username: 'nikk' })
      assert.deepEqual(request.original(), { username: 'virk' })
      assert.isTrue(Object.isFrozen(request.original()))

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end()
    })

    await supertest(server).post('/').expect(200)
  })
})
