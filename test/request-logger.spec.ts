/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import * as test from 'japa'
import { createServer } from 'http'
import * as supertest from 'supertest'
import { FakeLogger } from '@poppinss/logger'
import { HttpContext as BaseHttpContext } from '@poppinss/http-server'
import { HttpContextConstructorContract } from '@ioc:Adonis/Core/HttpContext'
import { RequestLogger } from '../src/HttpHooks/RequestLogger'

/**
 * We need to update the context reference so that it points to the correct
 * request class which is extended by us
 */
const HttpContext = BaseHttpContext as unknown as HttpContextConstructorContract

test.group('Request logger', () => {
  test('log http responses with 200 status', async (assert) => {
    const logger = new FakeLogger({ enabled: true, level: 'debug', name: 'adonis-app' })

    const server = createServer((req, res) => {
      const requestLogger = new RequestLogger({ logRequests: true })
      const ctx = HttpContext.create('/', {}, req, res)
      ctx.logger = logger
      requestLogger.onRequest(ctx)
      ctx.response.send('')
      ctx.response.finish()
    })

    await supertest(server).get('/')

    assert.equal(logger.logs[0].method, 'GET')
    assert.equal(logger.logs[0].msg, 'http request')
    assert.equal(logger.logs[0].level, logger.levels.values.info)
  })

  test('log http responses with 400 status', async (assert) => {
    const logger = new FakeLogger({ enabled: true, level: 'debug', name: 'adonis-app' })

    const server = createServer((req, res) => {
      const requestLogger = new RequestLogger({ logRequests: true })
      const ctx = HttpContext.create('/', {}, req, res)
      ctx.logger = logger
      requestLogger.onRequest(ctx)
      ctx.response.status(400).send('')
      ctx.response.finish()
    })

    await supertest(server).get('/')

    assert.equal(logger.logs[0].method, 'GET')
    assert.equal(logger.logs[0].msg, 'http request')
    assert.equal(logger.logs[0].level, logger.levels.values.warn)
  })

  test('log http responses with 500 status', async (assert) => {
    const logger = new FakeLogger({ enabled: true, level: 'debug', name: 'adonis-app' })

    const server = createServer((req, res) => {
      const requestLogger = new RequestLogger({ logRequests: true })
      const ctx = HttpContext.create('/', {}, req, res)
      ctx.logger = logger
      requestLogger.onRequest(ctx)
      ctx.response.status(503).send(new Error('a'))
      ctx.response.finish()
    })

    await supertest(server).get('/')

    assert.equal(logger.logs[0].method, 'GET')
    assert.equal(logger.logs[0].msg, 'http request')
    assert.equal(logger.logs[0].level, logger.levels.values.error)
  })
})
