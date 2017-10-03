'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const test = require('japa')
const http = require('http')
const sig = require('cookie-signature')
const querystring = require('querystring')
const simpleEncryptor = require('simple-encryptor')
const { Config } = require('@adonisjs/sink')
const supertest = require('supertest')

const Response = require('../../src/Response')
const RouteStore = require('../../src/Route/Store')
const RouteManager = require('../../src/Route/Manager')
const SECRET = 'averylongsecretkey'

test.group('Response', (group) => {
  group.beforeEach(() => {
    RouteStore.clear()
  })

  test('send raw string as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send('hello world')
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 'hello world')
  })

  test('send json object as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send({name: 'virk'})
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /json/).expect(200)
    assert.deepEqual(res.body, {name: 'virk'})
  })

  test('send number as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send(22)
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 22)
  })

  test('send boolean as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send(true)
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 'true')
  })

  test('send html as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send('<h2> Hello world </h2>')
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /html/).expect(200)
    assert.equal(res.text, '<h2> Hello world </h2>')
  })

  test('set http response status', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.status(304).send('hello')
      response.end()
    })
    await supertest(server).get('/').expect(304)
  })

  test('set http request header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.end()
    })
    await supertest(server).get('/').expect('link', '<http://localhost/>, <http://localhost:3000/>')
  })

  test('only set the header when does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.safeHeader('Content-Type', 'application/json')
      response.safeHeader('Content-Type', 'text/plain')
      response.send('')
      response.end()
    })
    await supertest(server).get('/').expect('Content-Type', /json/)
  })

  test('remove response header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.removeHeader('link')
      response.end()
    })
    const res = await supertest(server).get('/')
    assert.notProperty(res.headers, 'link')
  })

  test('get value for existing header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.send(response.getHeader('link'))
      response.end()
    })
    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body, ['<http://localhost/>', '<http://localhost:3000/>'])
  })

  test('download file', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.download(path.join(__dirname, '../../package.json'))
    })
    const res = await supertest(server).get('/').expect(200)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('send 404 when file does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.download(path.join(__dirname, '../../logo.svg'))
    })
    await supertest(server).get('/').expect(404)
  })

  test('force download the file by setting content-disposition', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.attachment(path.join(__dirname, '../../package.json'))
    })

    const res = await supertest(server).get('/').expect('Content-Disposition', /filename="package.json"/)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('force download the file with different file name', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.attachment(path.join(__dirname, '../../package.json'), 'adonis.json')
    })

    const res = await supertest(server).get('/').expect('Content-Disposition', /filename="adonis.json"/)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('set the location http header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.location('http://adonisjs.com')
      response.end()
    })

    await supertest(server).get('/').expect('Location', 'http://adonisjs.com')
  })

  test('redirect the request', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.redirect('http://adonisjs.com')
      response.end()
    })

    await supertest(server).get('/').expect('Location', 'http://adonisjs.com').expect(302)
  })

  test('set content-type based on type', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.type('html').send({username: 'virk'})
      response.end()
    })

    await supertest(server).get('/').expect('Content-Type', /html/).expect(200)
  })

  test('send content as json with content-type explicitly set to text/javascript', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.jsonp({username: 'virk'})
      response.end()
    })

    await supertest(server).get('/').expect('Content-Type', /javascript/).expect(200)
  })

  test('use the request query param callback for jsonp response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.jsonp({username: 'virk'})
      response.end()
    })

    const res = await supertest(server).get('/?callback=exec').expect(200)
    assert.equal(res.text, `/**/ typeof exec === 'function' && exec({"username":"virk"});`)
  })

  test('use the explicit callbackFn over request query param', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.jsonp({username: 'virk'}, 'eval')
      response.end()
    })

    const res = await supertest(server).get('/?callback=exec').expect(200)
    assert.equal(res.text, `/**/ typeof eval === 'function' && eval({"username":"virk"});`)
  })

  test('set 401 as the status via unauthorized method', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.unauthorized('Login First')
      response.end()
    })

    const res = await supertest(server).get('/').expect(401)
    assert.equal(res.text, 'Login First')
  })

  test('save cookie to the browser', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.cookie('cart_total', '20')
      response.send('')
      response.end()
    })

    const { headers } = await supertest(server).get('/').expect(200)
    assert.equal(headers['set-cookie'][0], 'cart_total=20')
  })

  test('encrypt cookie when secret is defined', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      config.set('app.appKey', SECRET)
      const response = new Response(req, res, config)
      response.cookie('cart_total', '20')
      response.send('')
      response.end()
    })

    const { headers } = await supertest(server).get('/').expect(200)
    const encrypter = simpleEncryptor({
      key: SECRET,
      hmac: false
    })

    assert.strictEqual(
      sig.unsign(
        encrypter.decrypt(querystring.unescape(headers['set-cookie'][0].replace('cart_total=', ''))).replace('s:', ''),
        SECRET
      ),
      '20'
    )
  })

  test('send plain cookie even if secret is defined', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      config.set('app.appKey', SECRET)
      const response = new Response(req, res, config)
      response.plainCookie('cart_total', '20')
      response.send('')
      response.end()
    })

    const { headers } = await supertest(server).get('/').expect(200)
    assert.equal(headers['set-cookie'][0], 'cart_total=20')
  })

  test('send vary header', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      const response = new Response(req, res, config)
      response.vary('Origin')
      response.send('')
      response.end()
    })

    const { headers } = await supertest(server).get('/').expect(200)
    assert.equal(headers.vary, 'Origin')
  })

  test('clear existing cookie by setting expiry in past', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      const response = new Response(req, res, config)
      response.clearCookie('cart')
      response.send('')
      response.end()
    })

    const { headers } = await supertest(server).get('/').expect(200)
    assert.equal(headers['set-cookie'][0], 'cart=; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  })

  test('redirect to a registered route', async (assert) => {
    RouteManager.get('users', function () {}).as('listUsers')

    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.route('listUsers')
      response.end()
    })

    await supertest(server).get('/').expect('Location', '/users').expect(302)
  })

  test('redirect to a registered route by passing controller method', async (assert) => {
    RouteManager.get('users', 'UserController.index')

    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.route('UserController.index')
      response.end()
    })

    await supertest(server).get('/').expect('Location', '/users').expect(302)
  })

  test('redirect to the string when unable to resolve route', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.route('UserController.index')
      response.end()
    })
    await supertest(server).get('/').expect('Location', 'UserController.index').expect(302)
  })

  test('redirect to dynamic route', async (assert) => {
    RouteManager.get('users/:id', 'UserController.show')

    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.route('UserController.show', { id: 2 })
      response.end()
    })

    await supertest(server).get('/').expect('Location', '/users/2').expect(302)
  })

  test('redirect with params', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.redirect('users', true)
      response.end()
    })

    await supertest(server).get('/?name=virk&age=22').expect('Location', 'users?name=virk&age=22').expect(302)
  })

  test('throw abort exception when abortIf expression is truthy', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortIf(true, 500, 'Aborted')
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(500)

    assert.equal(response.error.text, 'Aborted')
  })

  test('throw abort exception with default body and status', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortIf(true)
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(400)

    assert.equal(response.error.text, 'Request aborted')
  })

  test('evaluate expression when expression is a function', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortIf(function () { return true })
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(400)

    assert.equal(response.error.text, 'Request aborted')
  })

  test('do not throw exception when expression is not truthy', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortIf(function () { return false })
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    await supertest(server)
      .get('/?name=virk&age=22')
      .expect(204)
  })

  test('throw abort exception when abortUnless expression is falsy', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortUnless(false, 500, 'Aborted')
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(500)

    assert.equal(response.error.text, 'Aborted')
  })

  test('throw abort exception with default body and status', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortUnless(false)
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(400)

    assert.equal(response.error.text, 'Request aborted')
  })

  test('evaluate expression when expression is a function', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortUnless(function () { return false })
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    const response = await supertest(server)
      .get('/?name=virk&age=22')
      .expect(400)

    assert.equal(response.error.text, 'Request aborted')
  })

  test('do not throw exception when expression is not falsy', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      try {
        response.abortUnless(function () { return true })
      } catch (error) {
        response.status(error.status)
        response.send(error.body)
      }
      response.end()
    })

    await supertest(server)
      .get('/?name=virk&age=22')
      .expect(204)
  })

  test('do not set etag when set as false', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.send('hello world', { ignoreEtag: true })
      response.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.notProperty(res.headers, 'etag')
  })

  test('pull etag from config file', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      config.set('app.http.etag', false)
      const response = new Response(req, res, config)
      response.send('hello world')
      response.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.notProperty(res.headers, 'etag')
  })

  test('fallback etag to true', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      const response = new Response(req, res, config)
      response.send('hello world')
      response.end()
    })

    const res = await supertest(server).get('/').expect(200)
    assert.property(res.headers, 'etag')
  })

  test('do not set etag when set as false in explicit mode', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res, new Config())
      response.implicitEnd = false
      response.send('hello world', { ignoreEtag: true })
    })

    const res = await supertest(server).get('/').expect(200)
    assert.notProperty(res.headers, 'etag')
  })

  test('pull etag from config file in explicit mode', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      config.set('app.http.etag', false)
      const response = new Response(req, res, config)
      response.implicitEnd = false
      response.send('hello world')
    })

    const res = await supertest(server).get('/').expect(200)
    assert.notProperty(res.headers, 'etag')
  })

  test('fallback etag to true in explicit mode', async (assert) => {
    const server = http.createServer((req, res) => {
      const config = new Config()
      const response = new Response(req, res, config)
      response.implicitEnd = false
      response.send('hello world')
    })

    const res = await supertest(server).get('/').expect(200)
    assert.property(res.headers, 'etag')
  })
})
