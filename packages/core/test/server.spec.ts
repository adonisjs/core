/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { Router } from '@adonisjs/router'
import { createServer } from 'http'

import { Server } from '../src/Server'

test.group('Server', () => {
  test('execute registered route for a given request', async (assert) => {
    const router = new Router()
    router.get('/', ({ response }) => response.send('handled'))
    router.commit()

    const server = new Server(router)
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('raise 404 when route is missing', async (assert) => {
    const router = new Router()
    router.commit()

    const server = new Server(router)
    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(404)
    assert.equal(text, 'Cannot GET:/')
  })
})
