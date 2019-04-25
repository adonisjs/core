/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { FakeHttpContext, FakeLogger } from '@adonisjs/dev-utils'
import { Exception } from '@adonisjs/utils'
import { Request } from '@adonisjs/request'
import { Response } from '@adonisjs/response'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

test.group('HttpExceptionHandler', () => {
  test('do not report error if error code is in ignore list', (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected dontReport = ['E_BAD_REQUEST']
    }
    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs, [])
  })

  test('report error when not inside ignore list', (assert) => {
    class AppHandler extends HttpExceptionHandler {
    }
    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs, [
      {
        method: 'error',
        data: [{ requestId: undefined }, 'E_BAD_REQUEST: bad request'],
      },
    ])
  })

  test('report error with custom context', (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }
    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    handler.report(new Exception('bad request', 500, 'E_BAD_REQUEST'), ctx)

    assert.deepEqual(logger.logs, [
      {
        method: 'error',
        data: [{ username: 'virk' }, 'E_BAD_REQUEST: bad request'],
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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'text/html' }
    ctx.response.explicitEnd = true

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, ['<h1> bad request </h1>', undefined])
  })

  test('handle exception by returning json', async (assert) => {
    class AppHandler extends HttpExceptionHandler {
      protected context () {
        return { username: 'virk' }
      }
    }

    class InvalidAuth extends Exception {
    }

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'application/json' }
    ctx.response.explicitEnd = true

    await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.deepEqual(ctx.response.lazyBody!.args, [{ message: 'bad request' }, undefined])
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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'application/json' }
    ctx.response.explicitEnd = true

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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'text/html' }
    ctx.response.explicitEnd = true

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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'text/html' }
    ctx.response.explicitEnd = true

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

    const logger = new FakeLogger()
    const handler = new AppHandler(logger)

    const ctx = new FakeHttpContext(Request, Response, {})
    ctx.request.request.headers = { accept: 'text/html' }
    ctx.response.explicitEnd = true

    const response = await handler.handle(new InvalidAuth('bad request'), ctx)
    assert.equal(response, 'foo')
  })
})
