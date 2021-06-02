/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { FakeLogger } from '@adonisjs/logger'
import { Exception } from '@poppinss/utils'

import { fs, setupApp } from '../test-helpers'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

test.group('HttpExceptionHandler', (group) => {
  group.afterEach(async () => {
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')

    await fs.cleanup()
    delete process.env.NODE_ENV
  })

  test('do not report error if error code is in ignore list', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected ignoreCodes = ['E_BAD_REQUEST']
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const handler = new AppHandler(fakeLogger)
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(fakeLogger.logs, [])
  })

  test('report error when not inside ignore list', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    app.logger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })

    class AppHandler extends HttpExceptionHandler {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const handler = new AppHandler(app.logger)
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(
      (ctx.logger as FakeLogger).logs.map(({ level, msg }) => {
        return { level, msg }
      }),
      [
        {
          level: 50,
          msg: 'E_BAD_REQUEST: bad request',
        },
      ]
    )
  })

  test('ignore http status inside the ignore list', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    app.logger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })

    class AppHandler extends HttpExceptionHandler {
      protected ignoreStatuses = [500]
      protected dontReport = []
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const handler = new AppHandler(app.logger)
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)
    assert.deepEqual((app.logger as FakeLogger).logs, [])
  })

  test('report error with custom context', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    app.logger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const handler = new AppHandler(app.logger)
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(
      (app.logger as FakeLogger).logs.map(({ level, msg, username }) => {
        return { level, msg, username }
      }),
      [
        {
          level: 50,
          username: 'virk',
          msg: 'E_BAD_REQUEST: bad request',
        },
      ]
    )
  })

  test('call error report method if it exists', async (assert) => {
    assert.plan(1)

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public report() {
        assert.isTrue(true)
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const handler = new AppHandler(fakeLogger)
    handler.report(new InvalidAuth('bad request'), ctx)
  })

  test('handle exception by returning html', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.deepEqual(ctx.response.lazyBody, ['<h1> bad request </h1>', undefined])
  })

  test('handle exception by returning json', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'application/json' }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.deepEqual(ctx.response.lazyBody, [{ message: 'bad request' }, undefined])
  })

  test('handle exception by returning json api response', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'application/vnd.api+json' }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.deepEqual(ctx.response.lazyBody, [
      {
        errors: [
          {
            title: 'bad request',
            status: 500,
            code: undefined,
          },
        ],
      },
      undefined,
    ])
  })

  test('return stack trace when NODE_ENV=development', async (assert) => {
    process.env.NODE_ENV = 'development'

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'application/json' }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.exists(ctx.response.lazyBody[0].stack)
  })

  test('print youch html in development', async (assert) => {
    process.env.NODE_ENV = 'development'

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {}

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.isTrue(/youch/.test(ctx.response.lazyBody![0]))
  })

  test('call handle on actual exception when method exists', async (assert) => {
    assert.plan(1)

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public async handle() {
        assert.isTrue(true)
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)
  })

  test('use return value of exception handle method', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public async handle() {
        return 'foo'
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)

    const response = await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.equal(response, 'foo')
  })

  test('render status page when defined', async (assert) => {
    assert.plan(3)

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor(message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)
    ctx['view'] = {
      async render(view, data) {
        assert.equal(view, '404.edge')
        assert.equal(data.error.message, 'E_INVALID_AUTH: bad request')
      },
    }

    ctx.request.request.headers = { accept: 'text/html' }
    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('do not render status page when content negotiation passes for json', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor(message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'application/json' }

    const handler = new AppHandler(fakeLogger)
    ctx['view'] = {
      async render() {
        throw new Error('Not expected')
      },
    }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody, [{ message: 'E_INVALID_AUTH: bad request' }, undefined])
    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('do not render status page when disabled for development mode', async (assert) => {
    process.env.NODE_ENV = 'development'

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected disableStatusPagesInDevelopment = true

      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor(message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    const handler = new AppHandler(fakeLogger)
    ctx['view'] = {
      async render() {
        throw new Error('Not expected')
      },
    }

    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.isTrue(/youch/.test(ctx.response.lazyBody[0]))
    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('always render status page when in production mode', async (assert) => {
    assert.plan(3)
    process.env.NODE_ENV = 'production'

    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected disableStatusPagesInDevelopment = true

      protected context() {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor(message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    ctx.request.request.headers = { accept: 'text/html' }

    ctx['view'] = {
      async render(view, data) {
        assert.equal(view, '404.edge')
        assert.equal(data.error.message, 'E_INVALID_AUTH: bad request')
      },
    }

    const handler = new AppHandler(fakeLogger)
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('compute status pages from expression', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        '500..509': '500.edge',
      }

      protected context() {
        return { username: 'virk' }
      }
    }

    const handler = new AppHandler(fakeLogger)

    assert.deepEqual(handler.expandedStatusPages, {
      500: '500.edge',
      501: '500.edge',
      502: '500.edge',
      503: '500.edge',
      504: '500.edge',
      505: '500.edge',
      506: '500.edge',
      507: '500.edge',
      508: '500.edge',
      509: '500.edge',
    })
  })

  test('ensure expandedStatusPages is a singleton', async (assert) => {
    const app = await setupApp()
    app.container.useProxies()
    const fakeLogger = new FakeLogger({ enabled: true, name: 'adonisjs', level: 'info' })
    app.container.fake('Adonis/Core/Logger', () => fakeLogger)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        '500..509': '500.edge',
      }

      protected context() {
        return { username: 'virk' }
      }
    }

    const appHandler = new AppHandler(fakeLogger)
    assert.deepEqual(appHandler.expandedStatusPages, {
      500: '500.edge',
      501: '500.edge',
      502: '500.edge',
      503: '500.edge',
      504: '500.edge',
      505: '500.edge',
      506: '500.edge',
      507: '500.edge',
      508: '500.edge',
      509: '500.edge',
    })

    appHandler['statusPages'] = {
      '500..502': '500.edge',
    } as any

    assert.deepEqual(appHandler.expandedStatusPages, {
      500: '500.edge',
      501: '500.edge',
      502: '500.edge',
      503: '500.edge',
      504: '500.edge',
      505: '500.edge',
      506: '500.edge',
      507: '500.edge',
      508: '500.edge',
      509: '500.edge',
    })
  })
})
