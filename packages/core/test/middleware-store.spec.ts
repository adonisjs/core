/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { MiddlewareStore } from '../src/MiddlewareStore'

test.group('Middleware', () => {
  test('register global middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.register([handler])
    assert.deepEqual(middleware.get(), [handler])
  })

  test('register named middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.registerNamed({ auth: handler })
    assert.deepEqual(middleware['_named'], { auth: handler })
  })

  test('get named middleware', (assert) => {
    const middleware = new MiddlewareStore()
    async function handler () {}

    middleware.registerNamed({ auth: handler })
    assert.equal(middleware.getNamed('auth'), handler)
  })

  test('return null when middleware doesn\'t exists', (assert) => {
    const middleware = new MiddlewareStore()
    assert.isNull(middleware.getNamed('auth'))
  })
})
