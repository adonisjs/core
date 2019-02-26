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
import { join } from 'path'
import { createServer } from 'http'

import { Ioc, Registrar } from '@adonisjs/fold'
import { RouterContract } from '@adonisjs/router'
import { ServerContract, MiddlewareStoreContract } from '@adonisjs/server'

import { Helpers } from '../src/Helpers'

const ioc = new Ioc(false)
const registrar = new Registrar(ioc)

test.group('Server', (group) => {
  group.beforeEach(async () => {
    ioc.bind('Adonis/Src/Helpers', () => new Helpers(__dirname, { config: 'config' }))
    global['make'] = ioc.make.bind(ioc)
    await registrar.useProviders([join(__dirname, '../providers', 'AppProvider')]).registerAndBoot()
  })

  test('handle http requests', async (assert) => {
    const Route = ioc.use<RouterContract>('Route')
    Route.get('/', () => {
      return 'handled'
    })

    Route['commit']()

    const Server = ioc.use<ServerContract>('Server')
    Server.optimize()

    const server = createServer(Server.handle.bind(Server))

    const { text } = await supertest(server).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('read http request body', async (assert) => {
    const Route = ioc.use<RouterContract>('Route')
    const HttpMiddleware = ioc.use<MiddlewareStoreContract>('HttpMiddleware')

    HttpMiddleware.registerNamed({
      bodyparser: 'Adonis/Middleware/BodyParser',
    })

    Route.post('/', ({ request }) => {
      return request.all()
    }).middleware('bodyparser')

    Route['commit']()

    const Server = ioc.use<ServerContract>('Server')
    Server.optimize()

    const server = createServer(Server.handle.bind(Server))

    const { body } = await supertest(server).post('/').send({ username: 'virk' }).expect(200)
    assert.deepEqual(body, { username: 'virk' })
  })
})
