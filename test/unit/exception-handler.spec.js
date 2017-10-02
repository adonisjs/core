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
const { Config } = require('@adonisjs/sink')
const Request = require('../../src/Request')
const Response = require('../../src/Response')

const Handler = require('../../src/App/Handler')

test.group('Handler', () => {
  test('return youch html when in development env', async (assert) => {
    const server = http.createServer((req, res) => {
      process.env.NODE_ENV = 'development'
      const request = new Request(req, res, new Config())
      const response = new Response(req, res, new Config())
      const handler = new Handler()
      const error = new Error('Something bad')
      error.status = 500

      handler
        .handle(error, { request, response })
        .then(() => response.end())
    })

    const { text } = await supertest(server).get('/').expect(500)
    assert.include(text, 'error-message')
  })

  test('return youch json when accept header has json', async (assert) => {
    const server = http.createServer((req, res) => {
      process.env.NODE_ENV = 'development'
      const request = new Request(req, res, new Config())
      const response = new Response(req, res, new Config())
      const handler = new Handler()
      const error = new Error('Something bad')
      error.status = 500

      handler
        .handle(error, { request, response })
        .then(() => response.end())
    })

    const { body } = await supertest(server).get('/').set('Accept', 'application/json').expect(500)
    assert.equal(body.error.message, 'Something bad')
    assert.property(body.error, 'frames')
  })

  test('return plain error when in production environment', async (assert) => {
    const server = http.createServer((req, res) => {
      process.env.NODE_ENV = 'production'
      const request = new Request(req, res, new Config())
      const response = new Response(req, res, new Config())
      const handler = new Handler()
      const error = new Error('Something bad')
      error.status = 500

      handler
        .handle(error, { request, response })
        .then(() => response.end())
    })

    const { text } = await supertest(server).get('/').expect(500)
    assert.equal(text, 'Error: Something bad')
  })

  test('return json error when response accepts json', async (assert) => {
    const server = http.createServer((req, res) => {
      process.env.NODE_ENV = 'production'
      const request = new Request(req, res, new Config())
      const response = new Response(req, res, new Config())
      const handler = new Handler()
      const error = new Error('Something bad')
      error.status = 500

      handler
        .handle(error, { request, response })
        .then(() => response.end())
    })

    const { body } = await supertest(server).get('/').set('Accept', 'application/json').expect(500)
    assert.deepEqual(body, { name: 'Error', message: 'Something bad', status: 500 })
  })
})
