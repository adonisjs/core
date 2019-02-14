/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import * as supertest from 'supertest'
import { createServer } from 'http'
import { Request } from '@adonisjs/request'

import { BodyParserMiddleware } from '../src/BodyParser'

test.group('BodyParser Middleware', () => {
  test('handle request with form data', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(request.all()))
      })
    })

    const { body } = await supertest(server)
      .post('/')
      .type('form')
      .send({ username: 'virk' })

    assert.deepEqual(body, { username: 'virk' })
  })

  test('handle request with json body', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(request.all()))
      })
    })

    const { body } = await supertest(server)
      .post('/')
      .type('json')
      .send({ username: 'virk' })

    assert.deepEqual(body, { username: 'virk' })
  })

  test('handle request with raw body', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(request.raw())
      })
    })

    const { body } = await supertest(server)
      .post('/')
      .type('text')
      .send(JSON.stringify({ username: 'virk' }))

    assert.deepEqual(body, { username: 'virk' })
  })

  test('do not parse get requests', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(request.all()))
      })
    })

    const { body } = await supertest(server)
      .get('/')
      .type('json')
      .send({ username: 'virk' })

    assert.deepEqual(body, {})
  })

  test('by pass when body is empty', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(request.all()))
      })
    })

    const { body } = await supertest(server)
      .post('/')
      .type('json')

    assert.deepEqual(body, {})
  })

  test('by pass when content type is not supported', async (assert) => {
    const server = createServer(async (req, res) => {
      const request = new Request(req, res, {})
      const middleware = new BodyParserMiddleware({})

      await middleware.handle({ request }, () => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(request.all()))
      })
    })

    const { body } = await supertest(server)
      .post('/')
      .set('content-type', 'my-type')
      .send(JSON.stringify({ username: 'virk' }))

    assert.deepEqual(body, {})
  })
})
