/**
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { createServer } from 'http'

import { Request } from '../src/Request'

const fakeConfig = (config?) => {
  return Object.assign({}, config)
}

test.group('Request', () => {
  test('get http request query string', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(request.get()))
    })

    const { body } = await supertest(server).get('/?username=virk&age=22')
    assert.deepEqual(body, { username: 'virk', age: '22' })
  })

  test('update request initial body', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.setInitialBody({ username: 'virk' })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        post: request.post(),
        all: request.all(),
        original: request.original(),
      }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      post: { username: 'virk' },
      all: { username: 'virk' },
      original: { username: 'virk' },
    })
  })

  test('updating request body later must not impact the original body', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.setInitialBody({ username: 'virk' })
      request.updateBody({ username: 'nikk' })

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        post: request.post(),
        all: request.all(),
        original: request.original(),
      }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      post: { username: 'nikk' },
      all: { username: 'nikk' },
      original: { username: 'virk' },
    })
  })

  test('merge query string with all and original', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.setInitialBody({ username: 'virk' })
      request.updateBody({ username: 'nikk' })

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        post: request.post(),
        all: request.all(),
        original: request.original(),
      }))
    })

    const { body } = await supertest(server).get('/?age=22')
    assert.deepEqual(body, {
      post: { username: 'nikk' },
      all: { username: 'nikk', age: '22' },
      original: { username: 'virk', age: '22' },
    })
  })

  test('raise error when setInitialBody is called twice', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.setInitialBody({})

      try {
        request.setInitialBody({})
      } catch ({ message }) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ message }))
      }
    })

    const { body } = await supertest(server).get('/?age=22')
    assert.deepEqual(body, {
      message: 'Cannot re-set initial body. Use request.updateBody instead',
    })
  })

  test('compute original and all even if body was never set', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        post: request.post(),
        all: request.all(),
        original: request.original(),
      }))
    })

    const { body } = await supertest(server).get('/?age=22')
    assert.deepEqual(body, {
      post: {},
      all: { age: '22' },
      original: { age: '22' },
    })
  })

  test('compute all when query string is updated', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.updateQs({ age: '24' })

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        post: request.post(),
        all: request.all(),
        original: request.original(),
      }))
    })

    const { body } = await supertest(server).get('/?age=22')
    assert.deepEqual(body, {
      post: {},
      all: { age: '24' },
      original: { age: '22' },
    })
  })

  test('read input value from request', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ input: request.input('age') }))
    })

    const { body } = await supertest(server).get('/?age=22')
    assert.deepEqual(body, {
      input: '22',
    })
  })

  test('read nested input value from request', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ input: request.input('users.1') }))
    })

    const { body } = await supertest(server).get('/?users[0]=virk&users[1]=nikk')
    assert.deepEqual(body, {
      input: 'nikk',
    })
  })

  test('read nested input value from request', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ input: request.input('users.1') }))
    })

    const { body } = await supertest(server).get('/?users[0]=virk&users[1]=nikk')
    assert.deepEqual(body, {
      input: 'nikk',
    })
  })

  test('get all except few keys', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(request.except(['age'])))
    })

    const { body } = await supertest(server).get('/?age=22&username=virk')
    assert.deepEqual(body, {
      username: 'virk',
    })
  })

  test('get only few keys', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(request.only(['age'])))
    })

    const { body } = await supertest(server).get('/?age=22&username=virk')
    assert.deepEqual(body, {
      age: '22',
    })
  })

  test('get request headers', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(request.headers()))
    })

    const { body } = await supertest(server).get('/')
    assert.includeMembers(Object.keys(body), ['accept-encoding', 'user-agent', 'host'])
  })

  test('get value for a given request header', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ header: request.header('accept-encoding') }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      header: 'gzip, deflate',
    })
  })

  test('get ip address', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ip: request.ip() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      ip: '::ffff:127.0.0.1',
    })
  })

  test('get ip addresses as an array', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ip: request.ips() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      ip: ['::ffff:127.0.0.1'],
    })
  })

  test('get request protocol', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ protocol: request.protocol() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      protocol: 'http',
    })
  })

  test('get boolean telling request is secure or not', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ secure: request.secure() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      secure: false,
    })
  })

  test('get request hostname', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ hostname: request.hostname() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      hostname: '127.0.0.1',
    })
  })

  test('return an array of subdomains', async (assert) => {
    const server = createServer((req, res) => {
      req.headers.host = 'beta.adonisjs.com'

      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ subdomains: request.subdomains() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      subdomains: ['beta'],
    })
  })

  test('do not consider www a subdomain', async (assert) => {
    const server = createServer((req, res) => {
      req.headers.host = 'www.adonisjs.com'

      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ subdomains: request.subdomains() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      subdomains: [],
    })
  })

  test('return true for ajax when X-Requested-With is xmlhttprequest', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ajax: request.ajax() }))
    })

    const { body } = await supertest(server).get('/').set('X-Requested-With', 'XMLHttpRequest')
    assert.deepEqual(body, {
      ajax: true,
    })
  })

  test('return false for ajax when X-Requested-With header is missing', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ajax: request.ajax() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      ajax: false,
    })
  })

  test('return true for ajax when X-Pjax header is set', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ pjax: request.pjax() }))
    })

    const { body } = await supertest(server).get('/').set('X-Pjax', true)
    assert.deepEqual(body, {
      pjax: true,
    })
  })

  test('return request url without query string', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ url: request.url() }))
    })

    const { body } = await supertest(server).get('/?username=virk')
    assert.deepEqual(body, {
      url: '/',
    })
  })

  test('return request url with query string', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ url: request.url(true) }))
    })

    const { body } = await supertest(server).get('/?username=virk')
    assert.deepEqual(body, {
      url: '/?username=virk',
    })
  })

  test('return complete request url without query string', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ url: request.completeUrl() }))
    })

    const { body } = await supertest(server).get('/?username=virk')
    assert.deepEqual(body, {
      url: 'http://127.0.0.1/',
    })
  })

  test('return complete request url with query string', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ url: request.completeUrl(true) }))
    })

    const { body } = await supertest(server).get('/?username=virk')
    assert.deepEqual(body, {
      url: 'http://127.0.0.1/?username=virk',
    })
  })

  test('content negotiate the request content-type', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ type: request.is(['json', 'html']) }))
    })

    const { body } = await supertest(server)
      .post('/')
      .set('content-type', 'application/json')
      .send({ username: 'virk' })

    assert.deepEqual(body, {
      type: 'json',
    })
  })

  test('return null when request body is empty', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ type: request.is(['json', 'html']) }))
    })

    const { body } = await supertest(server).get('/').set('content-type', 'application/json')
    assert.deepEqual(body, {
      type: null,
    })
  })

  test('return all types from most to least preferred', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ types: request.types() }))
    })

    const { body } = await supertest(server).get('/').set('accept', 'application/json')
    assert.deepEqual(body, {
      types: ['application/json'],
    })
  })

  test('return the most relavant accept type', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ accepts: request.accepts(['jsonp', 'json']) }))
    })

    const { body } = await supertest(server).get('/').set('accept', 'application/json')
    assert.deepEqual(body, {
      accepts: 'json',
    })
  })

  test('return all accept languages', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ languages: request.languages() }))
    })

    const { body } = await supertest(server).get('/').set('accept-language', 'en-uk')
    assert.deepEqual(body, {
      languages: ['en-uk'],
    })
  })

  test('return the most relavant language', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ language: request.language(['en', 'en-us', 'de']) }))
    })

    const { body } = await supertest(server).get('/').set('accept-language', 'en-uk')
    assert.deepEqual(body, {
      language: 'en',
    })
  })

  test('return all accept charsets', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ charsets: request.charsets() }))
    })

    const { body } = await supertest(server).get('/').set('accept-charset', 'utf-8')
    assert.deepEqual(body, {
      charsets: ['utf-8'],
    })
  })

  test('return most relevant charset', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ charset: request.charset(['utf-8', 'base64']) }))
    })

    const { body } = await supertest(server).get('/').set('accept-charset', 'utf-8')
    assert.deepEqual(body, {
      charset: 'utf-8',
    })
  })

  test('return all encodings', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ encodings: request.encodings() }))
    })

    const { body } = await supertest(server).get('/').set('accept-encoding', 'gzip')
    assert.deepEqual(body, {
      encodings: ['gzip', 'identity'],
    })
  })

  test('return matching encoding', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ encoding: request.encoding(['utf-8', 'gzip']) }))
    })

    const { body } = await supertest(server).get('/').set('accept-encoding', 'gzip')
    assert.deepEqual(body, {
      encoding: 'gzip',
    })
  })

  test('return false from hasBody when request has no body', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ hasBody: request.hasBody() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      hasBody: false,
    })
  })

  test('return true from hasBody when request has no body', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ hasBody: request.hasBody() }))
    })

    const { body } = await supertest(server).post('/').set('username', 'virk')
    assert.deepEqual(body, {
      hasBody: true,
    })
  })

  test('return true from request.fresh when etag and if-match-none are same', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.setHeader('etag', 'foo')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ fresh: request.fresh() }))
    })

    const { body } = await supertest(server).get('/').set('if-none-match', 'foo')
    assert.deepEqual(body, {
      fresh: true,
    })
  })

  test('return false from request.fresh when etag and if-match-none are same but method is POST', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.setHeader('etag', 'foo')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ fresh: request.fresh() }))
    })

    const { body } = await supertest(server).post('/').set('if-none-match', 'foo')
    assert.deepEqual(body, {
      fresh: false,
    })
  })

  test('return false from request.fresh when etag and if-match-none are same but statusCode is 301', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.setHeader('etag', 'foo')
      res.writeHead(301, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ fresh: request.fresh() }))
    })

    const { body } = await supertest(server).get('/').set('if-none-match', 'foo')
    assert.deepEqual(body, {
      fresh: false,
    })
  })

  test('return request http method', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ method: request.method() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      method: 'GET',
    })
  })

  test('return request spoofed http method when spoofing is enabled', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig({ allowMethodSpoofing: true })
      const request = new Request(req, res, config)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ method: request.method() }))
    })

    const { body } = await supertest(server).post('/?_method=put')
    assert.deepEqual(body, {
      method: 'PUT',
    })
  })

  test('return original http method when spoofing is enabled but original method is GET', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig({ allowMethodSpoofing: true })
      const request = new Request(req, res, config)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ method: request.method() }))
    })

    const { body } = await supertest(server).get('/?_method=put')
    assert.deepEqual(body, {
      method: 'GET',
    })
  })

  test('call getIp method to return ip address when defined inside config', async (assert) => {
    const server = createServer((req, res) => {
      const config = fakeConfig({
        getIp (request) {
          return request.header('host').split(':')[0]
        },
      })

      const request = new Request(req, res, config)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ip: request.ip() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      ip: '127.0.0.1',
    })
  })

  test('return false from request.stale when etag and if-match-none are same', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      res.setHeader('etag', 'foo')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ stale: request.stale() }))
    })

    const { body } = await supertest(server).get('/').set('if-none-match', 'foo')
    assert.deepEqual(body, {
      stale: false,
    })
  })

  test('handle referer header spelling inconsistencies', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ referrer: request.header('referrer'), referer: request.header('referer') }))
    })

    const { body } = await supertest(server).get('/').set('referer', 'foo.com')
    assert.deepEqual(body, {
      referrer: 'foo.com',
      referer: 'foo.com',
    })
  })

  test('update request raw body', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      request.updateRawBody(JSON.stringify({ username: 'virk' }))
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end(request.raw())
    })

    const { text } = await supertest(server).get('/')
    assert.deepEqual(JSON.parse(text), { username: 'virk' })
  })

  test('get null when request hostname is missing', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      delete req.headers['host']

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ hostname: request.hostname() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      hostname: null,
    })
  })

  test('get empty array when for subdomains request hostname is missing', async (assert) => {
    const server = createServer((req, res) => {
      const request = new Request(req, res, fakeConfig())
      delete req.headers['host']

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ subdomains: request.subdomains() }))
    })

    const { body } = await supertest(server).get('/')
    assert.deepEqual(body, {
      subdomains: [],
    })
  })
})
