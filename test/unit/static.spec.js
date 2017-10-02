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
const { setupResolver, Config, Logger, Helpers } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const supertest = require('supertest')

const Server = require('../../src/Server')
const Route = require('../../src/Route/Manager')
const Request = require('../../src/Request')
const Response = require('../../src/Response')
const Context = require('../../src/Context')
const Static = require('../../src/Static')
const Exception = require('../../src/Exception')

test.group('Static', (group) => {
  group.before(() => {
    Context.getter('request', function () {
      return new Request(this.req, this.res, new Config())
    }, true)

    Context.getter('response', function () {
      return new Response(this.req, this.res, new Config())
    }, true)
    setupResolver()
  })

  group.beforeEach(() => {
    this.exception = Exception
    this.logger = new Logger()
    ioc.restore()
    this.exception.clear()
  })

  test('return 404 when static resource is not found', async (assert) => {
    Route.get('/', function ({ response }) {
      response.send('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)

    ioc.fake('Adonis/Middleware/Static', function () {
      return Static(new Helpers(__dirname), new Config())
    })

    server.use(['Adonis/Middleware/Static'])

    const app = http.createServer(server.handle.bind(server))

    await supertest(app).get('/foo.css').expect(404)
  })

  test('return resource when exists inside public dir', async (assert) => {
    Route.get('/', function ({ response }) {
      response.send('foo')
    })

    const server = new Server(Context, Route, this.logger, this.exception)

    ioc.fake('Adonis/Middleware/Static', function () {
      return Static(new Helpers(__dirname), new Config())
    })

    server.use(['Adonis/Middleware/Static'])
    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).get('/style.css').expect(200)
    assert.equal(text.trim(), `body { background: #000; }`)
  })

  test('skip request when verb is not GET or HEAD', async (assert) => {
    Route.post('/style.css', function ({ response }) {
      response.send('style')
    })

    const server = new Server(Context, Route, this.logger, this.exception)

    ioc.fake('Adonis/Middleware/Static', function () {
      return Static(new Helpers(__dirname), new Config())
    })

    server.use(['Adonis/Middleware/Static'])
    const app = http.createServer(server.handle.bind(server))
    const { text } = await supertest(app).post('/style.css').expect(200)
    assert.equal(text.trim(), 'style')
  })
})
