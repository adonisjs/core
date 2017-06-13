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
const supertest = require('supertest')

const Response = require('../../src/Response')

test.group('Response', () => {
  test('send raw string as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.send('hello world')
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 'hello world')
  })

  test('send json object as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.send({name: 'virk'})
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /json/).expect(200)
    assert.deepEqual(res.body, {name: 'virk'})
  })

  test('send number as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.send(22)
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 22)
  })

  test('send boolean as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.send(true)
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /plain/).expect(200)
    assert.equal(res.text, 'true')
  })

  test('send html as response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.send('<h2> Hello world </h2>')
      response.end()
    })

    const res = await supertest(server).get('/').expect('Content-Type', /html/).expect(200)
    assert.equal(res.text, '<h2> Hello world </h2>')
  })

  test('set http response status', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.status(304).send('hello')
      response.end()
    })
    await supertest(server).get('/').expect(304)
  })

  test('set http request header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.end()
    })
    await supertest(server).get('/').expect('link', '<http://localhost/>, <http://localhost:3000/>')
  })

  test('only set the header when does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.safeHeader('Content-Type', 'application/json')
      response.safeHeader('Content-Type', 'text/plain')
      response.send('')
      response.end()
    })
    await supertest(server).get('/').expect('Content-Type', /json/)
  })

  test('remove response header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.removeHeader('link')
      response.end()
    })
    const res = await supertest(server).get('/')
    assert.notProperty(res.headers, 'link')
  })

  test('get value for existing header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.header('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
      response.send(response.getHeader('link'))
      response.end()
    })
    const res = await supertest(server).get('/').expect(200)
    assert.deepEqual(res.body, ['<http://localhost/>', '<http://localhost:3000/>'])
  })

  test('download file', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.download(path.join(__dirname, '../../package.json'))
    })
    const res = await supertest(server).get('/').expect(200)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('send 404 when file does not exists', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.download(path.join(__dirname, '../../logo.svg'))
    })
    await supertest(server).get('/').expect(404)
  })

  test('force download the file by setting content-disposition', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.attachment(path.join(__dirname, '../../package.json'))
    })

    const res = await supertest(server).get('/').expect('Content-Disposition', /filename="package.json"/)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('force download the file with different file name', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.attachment(path.join(__dirname, '../../package.json'), 'adonis.json')
    })

    const res = await supertest(server).get('/').expect('Content-Disposition', /filename="adonis.json"/)
    assert.isObject(res.body)
    assert.equal(res.body.name, '@adonisjs/framework')
  })

  test('set the location http header', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.location('http://adonisjs.com')
      response.end()
    })

    await supertest(server).get('/').expect('Location', 'http://adonisjs.com')
  })

  test('redirect the request', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.redirect('http://adonisjs.com')
    })

    await supertest(server).get('/').expect('Location', 'http://adonisjs.com').expect(302)
  })

  test('set content-type based on type', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.type('html').send({username: 'virk'})
      response.end()
    })

    await supertest(server).get('/').expect('Content-Type', /html/).expect(200)
  })

  test('send content as json with content-type explicitly set to text/javascript', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.jsonp({username: 'virk'})
      response.end()
    })

    await supertest(server).get('/').expect('Content-Type', /javascript/).expect(200)
  })

  test('use the request query param callback for jsonp response', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.jsonp({username: 'virk'})
      response.end()
    })

    const res = await supertest(server).get('/?callback=exec').expect(200)
    assert.equal(res.text, `/**/ typeof exec === 'function' && exec({"username":"virk"});`)
  })

  test('use the explicit callbackFn over request query param', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.jsonp({username: 'virk'}, 'eval')
      response.end()
    })

    const res = await supertest(server).get('/?callback=exec').expect(200)
    assert.equal(res.text, `/**/ typeof eval === 'function' && eval({"username":"virk"});`)
  })

  test('set 401 as the status via unauthorized method', async (assert) => {
    const server = http.createServer((req, res) => {
      const response = new Response(req, res)
      response.unauthorized('Login First')
      response.end()
    })

    const res = await supertest(server).get('/').expect(401)
    assert.equal(res.text, 'Login First')
  })
})
