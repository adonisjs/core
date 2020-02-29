/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Exception } from '@poppinss/utils'
import { FakeLogger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { HttpContext } from '@adonisjs/http-server/build/standalone'
import { Encryption } from '@adonisjs/encryption/build/standalone'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

const loggerConfig = {
  name: 'adonis-app',
  enabled: true,
  messageKey: 'msg',
  level: 'debug',
}

const encryption = new Encryption('verylongandrandom32characterskey')

test.group('HttpExceptionHandler', () => {
  test('do not report error if error code is in ignore list', (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected ignoreCodes = ['E_BAD_REQUEST']
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs, [])
  })

  test('report error when not inside ignore list', (assert) => {
    class AppHandler extends HttpExceptionHandler {
    }
    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs.map(({ level, msg }) => {
      return { level, msg }
    }), [
      {
        level: 50,
        msg: 'E_BAD_REQUEST: bad request',
      },
    ])
  })

  test('ignore http status inside the ignore list', (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected ignoreStatuses = [500]
      protected dontReport = []
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs, [])
  })

  test('report error with custom context', (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }
    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs.map(({ level, msg, username }) => {
      return { level, msg, username}
    }), [
      {
        level: 50,
        username: 'virk',
        msg: 'E_BAD_REQUEST: bad request',
      },
    ])
  })

  test('call error report method if it exists', (assert) => {
    assert.plan(1)

    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public report () {
        assert.isTrue(true)
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    handler.report(new InvalidAuth('bad request'), ctx)
  })

  test('handle exception by returning html', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'text/html' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, ['<h1> bad request </h1>', false])
  })

  test('handle exception by returning json', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'application/json' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, [{ message: 'bad request' }, false])
  })

  test('handle exception by returning json api response', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'application/vnd.api+json' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, [
      {
        errors: [{
          title: 'bad request',
          status: 500,
          code: undefined,
        }],
      },
      false,
    ])
  })

  test('return stack trace when NODE_ENV=development', async (assert) => {
    process.env.NODE_ENV = 'development'
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'application/json' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.exists(ctx.response.lazyBody!.args[0].stack)

    delete process.env.NODE_ENV
  })

  test('print youch html in development', async (assert) => {
    process.env.NODE_ENV = 'development'
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'text/html' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.isTrue(/youch/.test(ctx.response.lazyBody!.args[0]))

    delete process.env.NODE_ENV
  })

  test('call handle on actual exception when method exists', async (assert) => {
    assert.plan(1)

    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public async handle () {
        assert.isTrue(true)
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'text/html' }

    await handler.handle(new InvalidAuth('bad request'), ctx)
  })

  test('use return value of exception handle method', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      public async handle () {
        return 'foo'
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx.request.request.headers = { accept: 'text/html' }

    const response = await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.equal(response, 'foo')
  })

  test('render status page when defined', async (assert) => {
    assert.plan(3)

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor (message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx['view'] = {
      render (view, data) {
        assert.equal(view, '404.edge')
        assert.equal(data.error.message, 'E_INVALID_AUTH: bad request')
      },
    }

    ctx.request.request.headers = { accept: 'text/html' }
    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('do not render status page when content negotiation passes for json', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor (message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx['view'] = {
      render () {
        throw new Error('Not expected')
      },
    }

    ctx.request.request.headers = { accept: 'application/json' }
    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, [{ message: 'E_INVALID_AUTH: bad request' }, false])
    assert.equal(ctx.response.response.statusCode, 404)
  })

  test('do not render status page when disabled for development mode', async (assert) => {
    process.env.NODE_ENV = 'development'

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected disableStatusPagesInDevelopment = true

      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor (message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx['view'] = {
      render () {
        throw new Error('Not expected')
      },
    }

    ctx.request.request.headers = { accept: 'text/html' }
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.isTrue(/youch/.test(ctx.response.lazyBody!.args[0]))
    assert.equal(ctx.response.response.statusCode, 404)

    delete process.env.NODE_ENV
  })

  test('always render status page when in production mode', async (assert) => {
    assert.plan(3)

    process.env.NODE_ENV = 'production'

    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        404: '404.edge',
      }

      protected disableStatusPagesInDevelopment = true

      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
      constructor (message) {
        super(message, 404, 'E_INVALID_AUTH')
      }
    }

    const logger = new FakeLogger(loggerConfig)
    const handler = new AppHandler(logger)

    const ctx = HttpContext.create(
      '/',
      {},
      logger,
      new Profiler(__dirname, logger, {}).create(''),
      encryption,
    )
    ctx['view'] = {
      render (view, data) {
        assert.equal(view, '404.edge')
        assert.equal(data.error.message, 'E_INVALID_AUTH: bad request')
      },
    }

    ctx.request.request.headers = { accept: 'text/html' }
    await handler.handle(new InvalidAuth('bad request'), ctx)

    assert.equal(ctx.response.response.statusCode, 404)
    delete process.env.NODE_ENV
  })

  test('compute status pages from expression', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        '500..509': '500.edge',
      }

      protected context () {
        return { username: 'virk' }
      }
    }

    const appHandler = new AppHandler(new FakeLogger(loggerConfig))
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

  test('ensure expandedStatusPages is a singleton', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected statusPages = {
        '500..509': '500.edge',
      }

      protected context () {
        return { username: 'virk' }
      }
    }

    const appHandler = new AppHandler(new FakeLogger(loggerConfig))
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
