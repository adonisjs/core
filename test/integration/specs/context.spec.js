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
const supertest = require('supertest')
const { ioc } = require('@adonisjs/fold')
const RouteStore = require('../../../src/Route/Store')
const appUrl = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Context - Share', (group) => {
  group.after(() => {
    delete process.env.ENV_SILENT
  })

  group.beforeEach(() => {
    ioc.restore()
    RouteStore.clear()
  })

  test('share request with view', async (assert) => {
    const Route = use('Route')

    Route.get('/', function ({ view }) {
      return view._locals.request.url()
    })

    const { text } = await supertest(appUrl).get('/').expect(200)
    assert.equal(text, '/')
  })

  test('call {is} method from view locals', async (assert) => {
    const Route = use('Route')

    Route.get('/', function ({ view }) {
      return view._locals.is('/')
    })

    const { text } = await supertest(appUrl).get('/').expect(200)
    assert.equal(text, 'true')
  })
})
