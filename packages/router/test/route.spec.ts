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
    const route = new Route('/', ['GET'], handler, 'App/Controllers/Http', {})

    assert.deepEqual(route.toJSON(), {
      pattern: '/',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('/', ['GET'], handler, 'App/Controllers/Http', {})
    route.prefix('admin')

    assert.deepEqual(route.toJSON(), {
      pattern: '/admin',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('/blog', ['GET'], handler, 'App/Controllers/Http', {})

    assert.deepEqual(route.toJSON(), {
      pattern: '/blog',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('/blog', ['GET'], handler, 'App/Controllers/Http', {})
    route.prefix('admin')

    assert.deepEqual(route.toJSON(), {
      pattern: '/admin/blog',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {})
    route.where('id', '^[a-z]+$')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
      methods: ['GET'],
      matchers: {
        id: /^[a-z]+$/,
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define global matchers for params', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {
      id: /^[a-z]+$/,
    })

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
      methods: ['GET'],
      matchers: {
        id: /^[a-z]+$/,
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('give preference to local matcher over global', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {
      id: /^[a-z]+$/,
    })
    route.where('id', '(.*)')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
      methods: ['GET'],
      matchers: {
        id: /(.*)/,
      },
      domain: 'root',
      handler,
      name: undefined,
      middleware: [],
    })
  })

  test('define route domain', (assert) => {
    function handler () {}
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {})
    route.domain('foo.com')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {})
    route.middleware(['auth', 'acl:admin'])

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {})
    route.middleware('auth')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
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
    const route = new Route('posts/:id', ['GET'], handler, 'App/Controllers/Http', {})
    route.as('showPost')

    assert.deepEqual(route.toJSON(), {
      pattern: '/posts/:id',
      meta: {
        namespace: 'App/Controllers/Http',
      },
      methods: ['GET'],
      matchers: {},
      domain: 'root',
      handler,
      middleware: [],
      name: 'showPost',
    })
  })
})
