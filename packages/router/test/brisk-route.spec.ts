/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { BriskRoute } from '../src/BriskRoute'

test.group('Brisk Route', () => {
  test('define handler for the route', (assert) => {
    const brisk = new BriskRoute('/', 'App/Controllers/Http', {})
    function handler () {}

    const route = brisk.setHandler(handler, 'render')
    assert.deepEqual(route.toJSON(), {
      domain: 'root',
      handler,
      matchers: {},
      meta: {
        namespace: 'App/Controllers/Http',
      },
      methods: ['GET'],
      middleware: [],
      name: undefined,
      pattern: '/',
    })
  })

  test('setting handler multiple times must result in error', (assert) => {
    const brisk = new BriskRoute('/', 'App/Controllers/Http', {})
    function handler () {}

    brisk.setHandler(handler, 'render')
    const fn = () => brisk.setHandler(handler, 'respond')

    assert.throw(fn, 'E_MULTIPLE_BRISK_HANDLERS: `Route.respond` and `render` cannot be called together')
  })
})
