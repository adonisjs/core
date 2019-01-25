/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Store } from '../src/Store'

test.group('Store | add', () => {
  test('add route without explicit domain', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/',
      methods: ['GET'],
      handler: handler,
      matchers: {},
      meta: {},
      middleware: [],
    })

    assert.deepEqual(store.tree, {
      tokens: [[{
        old: 'root',
        type: 0,
        val: 'root',
        end: '',
      }]],
      domains: {
        'root': {
          'GET': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
        },
      },
    })
  })

  test('add route with custom domain', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/',
      methods: ['GET'],
      meta: {},
      handler: handler,
      matchers: {},
      domain: 'foo.com',
      middleware: [],
    })

    assert.deepEqual(store.tree, {
      tokens: [[{
        old: 'foo.com',
        type: 0,
        val: 'foo.com',
        end: '',
      }]],
      domains: {
        'foo.com': {
          'GET': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
        },
      },
    })
  })

  test('raise error when route with duplicate pattern', (assert) => {
    function handler () {}
    const route = {
      pattern: '/',
      methods: ['GET'],
      handler: handler,
      matchers: {},
      meta: {},
      domain: 'foo.com',
      middleware: [],
    }

    const store = new Store()
    store.add(route)

    const fn = () => store.add(route)
    assert.throw(fn, 'Duplicate route `GET:/`')
  })

  test('work fine when pattern is same but method is different', (assert) => {
    function handler () {}
    const route = {
      pattern: '/',
      methods: ['GET'],
      handler: handler,
      matchers: {},
      meta: {},
      domain: 'foo.com',
      middleware: [],
    }

    const store = new Store()
    store.add(route)
    store.add(Object.assign({}, route, { methods: ['POST'] }))

    assert.deepEqual(store.tree, {
      tokens: [[{
        old: 'foo.com',
        type: 0,
        val: 'foo.com',
        end: '',
      }]],
      domains: {
        'foo.com': {
          'GET': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
          'POST': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
        },
      },
    })
  })

  test('work fine when pattern is same but domain is different', (assert) => {
    function handler () {}
    const route = {
      pattern: '/',
      methods: ['GET'],
      handler: handler,
      matchers: {},
      meta: {},
      domain: 'foo.com',
      middleware: [],
    }

    const store = new Store()
    store.add(route)
    store.add(Object.assign({}, route, { domain: 'root' }))

    assert.deepEqual(store.tree, {
      tokens: [
        [{
          old: 'foo.com',
          type: 0,
          val: 'foo.com',
          end: '',
        }],
        [{
          old: 'root',
          type: 0,
          val: 'root',
          end: '',
        }],
      ],
      domains: {
        'foo.com': {
          'GET': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
        },
        'root': {
          'GET': {
            tokens: [[{
              old: '/',
              type: 0,
              val: '/',
              end: '',
            }]],
            routes: {
              '/': {
                pattern: '/',
                meta: {},
                handler,
                middleware: [],
              },
            },
          },
        },
      },
    })
  })
})

test.group('Store | match', () => {
  test('match url for given method', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/', 'GET'), {
      route: {
        pattern: '/',
        handler,
        middleware: [],
        meta: {},
      },
      params: {},
      subdomains: {},
    })
  })

  test('match url with params', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:username',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/virk', 'GET'), {
      route: {
        pattern: '/:username',
        handler,
        middleware: [],
        meta: {},
      },
      params: {
        username: 'virk',
      },
      subdomains: {},
    })
  })

  test('match url with optional params', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:username?',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/virk', 'GET'), {
      route: {
        pattern: '/:username?',
        handler,
        meta: {},
        middleware: [],
      },
      params: {
        username: 'virk',
      },
      subdomains: {},
    })

    assert.deepEqual(store.match('/', 'GET'), {
      route: {
        pattern: '/:username?',
        handler,
        middleware: [],
        meta: {},
      },
      params: {},
      subdomains: {},
    })
  })

  test('match routes from top to bottom', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:username',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    store.add({
      pattern: '/:id',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/virk', 'GET'), {
      route: {
        pattern: '/:username',
        handler,
        middleware: [],
        meta: {},
      },
      params: {
        username: 'virk',
      },
      subdomains: {},
    })
  })

  test('test url against matchers', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:username',
      handler,
      meta: {},
      matchers: {
        username: new RegExp(/[a-z]+/),
      },
      middleware: [],
      methods: ['GET'],
    })

    store.add({
      pattern: '/:id',
      handler,
      meta: {},
      matchers: {
        id: new RegExp(/[0-9]+/),
      },
      middleware: [],
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/1', 'GET'), {
      route: {
        pattern: '/:id',
        handler,
        meta: {},
        middleware: [],
      },
      params: {
        id: '1',
      },
      subdomains: {},
    })
  })

  test('match domain for urls', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:username',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    store.add({
      pattern: '/:id',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      domain: 'foo.com',
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/1', 'GET', 'foo.com'), {
      route: {
        pattern: '/:id',
        handler,
        meta: {},
        middleware: [],
      },
      params: {
        id: '1',
      },
      subdomains: {},
    })
  })

  test('match for dynamic domains', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:id',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      domain: ':subdomain.adonisjs.com',
      methods: ['GET'],
    })

    assert.deepEqual(store.match('/1', 'GET', 'blog.adonisjs.com'), {
      route: {
        pattern: '/:id',
        handler,
        meta: {},
        middleware: [],
      },
      params: {
        id: '1',
      },
      subdomains: {
        subdomain: 'blog',
      },
    })
  })

  test('return null when unable to match the route domain', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:id',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.isNull(store.match('/1', 'GET', 'blog.adonisjs.com'))
  })

  test('return null when unable to match the method', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/:id',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.isNull(store.match('/1', 'POST', 'root'))
  })

  test('return null when unable to match the route url', (assert) => {
    function handler () {}

    const store = new Store()
    store.add({
      pattern: '/',
      handler,
      matchers: {},
      meta: {},
      middleware: [],
      methods: ['GET'],
    })

    assert.isNull(store.match('/hello', 'GET', 'root'))
  })
})
