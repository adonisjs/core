/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { RouteGroup } from '../src/Group'
import { Route } from '../src/Route'

test.group('Router', () => {
  test('add matcher for the given route', (assert) => {
    function handler () {}
    const group = new RouteGroup([new Route('/:id', ['GET'], handler, {})])
    group.where('id', '[a-z]')

    assert.deepEqual(group.routes.map((route) => route.toJSON()), [
      {
        pattern: '/:id',
        matchers: {
          id: '[a-z]',
        },
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler,
      },
    ])
  })

  test('prepend middleware to existing route middleware', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    route.middleware('auth')

    const group = new RouteGroup([route])
    group.middleware('limitter')

    assert.deepEqual(group.routes.map((route) => route.toJSON()), [
      {
        pattern: '/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: ['limitter', 'auth'],
        handler,
      },
    ])
  })

  test('define routes prefix', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    const group = new RouteGroup([route])
    group.prefix('api/v1')

    assert.deepEqual(group.routes.map((route) => route.toJSON()), [
      {
        pattern: 'api/v1/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler,
      },
    ])
  })

  test('define routes domain', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    const group = new RouteGroup([route])
    group.domain('adonisjs.com')

    assert.deepEqual(group.routes.map((route) => route.toJSON()), [
      {
        pattern: '/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'adonisjs.com',
        middleware: [],
        handler,
      },
    ])
  })
})
