/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Middleware } from '../src/Middleware'

test.group('Middleware', () => {
  test('register global middleware', (assert) => {
    const middleware = new Middleware()
    async function handler () {}

    middleware.register('http', [handler])
    assert.deepEqual(middleware.get('http'), [handler])
  })

  test('register named middleware', (assert) => {
    const middleware = new Middleware()
    async function handler () {}

    middleware.registerNamed('http', {
      'auth': handler,
    })
    assert.deepEqual(middleware.getNamed('http', 'auth'), handler)
  })

  test('register named middleware as a class', (assert) => {
    const middleware = new Middleware()
    class AuthMiddleware {
      public async handle () {}
    }

    middleware.registerNamed('http', {
      'auth': AuthMiddleware,
    })
    assert.deepEqual(middleware.getNamed('http', 'auth'), AuthMiddleware)
  })

  test('return null when unable to find named middleware', (assert) => {
    const middleware = new Middleware()
    middleware.register('http', [async function handler () {}])
    assert.isNull(middleware.getNamed('http', 'auth'))
  })

  test('return empty array when unable to find tag', (assert) => {
    const middleware = new Middleware()
    assert.deepEqual(middleware.get('http'), [])
  })

  test('return null when unable to find tag', (assert) => {
    const middleware = new Middleware()
    assert.isNull(middleware.getNamed('http', 'auth'))
  })
})
