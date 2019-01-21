/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Route } from '../src/Route'

test.group('Route', () => {
  test('create a basic route', (assert) => {
    function handler () {}
    const route = new Route('/', ['GET'], handler, {})

    assert.deepEqual(route.toJSON(), {
      pattern: '/',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('prefix route', (assert) => {
    function handler () {}
    const route = new Route('/', ['GET'], handler, {})
    route.prefix('admin')

    assert.deepEqual(route.toJSON(), {
      pattern: '/admin',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('handle leading slash in pattern', (assert) => {
    function handler () {}
    const route = new Route('/blog', ['GET'], handler, {})

    assert.deepEqual(route.toJSON(), {
      pattern: '/blog',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('handle leading slash in pattern along with prefix', (assert) => {
    function handler () {}
    const route = new Route('/blog', ['GET'], handler, {})
    route.prefix('admin')

    assert.deepEqual(route.toJSON(), {
      pattern: '/admin/blog',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define matchers for params', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {})
    route.where('id', '^[a-z]$+')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {
        id: '^[a-z]$+',
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define global matchers for params', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {
      id: '^[a-z]$+',
    })

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {
        id: '^[a-z]$+',
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('give preference to local matcher over global', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {
      id: '^[a-z]$+',
    })
    route.where('id', '(.*)')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {
        id: '(.*)',
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define route domain', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {})
    route.domain('foo.com')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {},
      domain: 'foo.com',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define an array of route middleware', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {})
    route.middleware(['auth', 'acl:admin'])

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: ['auth', 'acl:admin'],
    })
  })

  test('define route middleware as a string', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {})
    route.middleware('auth')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      name: undefined,
      middleware: ['auth'],
    })
  })

  test('give name to the route', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, {})
    route.as('showPost')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      middleware: [],
      name: 'showPost',
    })
  })
})
