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
import { RouteResource } from '../src/Resource'
import { toRoutesJSON } from '../test-helpers'

test.group('Route Group', () => {
  test('add matcher for the given route', (assert) => {
    function handler () {}
    const group = new RouteGroup([new Route('/:id', ['GET'], handler, {})])
    group.where('id', '[a-z]')

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/:id',
        matchers: {
          id: '[a-z]',
        },
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        name: undefined,
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

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: ['limitter', 'auth'],
        handler,
        name: undefined,
      },
    ])
  })

  test('prepend name to the existing route names', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    route.as('list')

    const group = new RouteGroup([route])
    group.as('v1')

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler,
        name: 'v1.list',
      },
    ])
  })

  test('define routes prefix', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    const group = new RouteGroup([route])
    group.prefix('api/v1')

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/api/v1/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler,
        name: undefined,
      },
    ])
  })

  test('define routes domain', (assert) => {
    function handler () {}

    const route = new Route('/:id', ['GET'], handler, {})
    const group = new RouteGroup([route])
    group.domain('adonisjs.com')

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'adonisjs.com',
        middleware: [],
        handler,
        name: undefined,
      },
    ])
  })

  test('define resource inside the group', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    const group = new RouteGroup([resource])

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.index',
        name: 'photos.index',
      },
      {
        pattern: '/photos/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.create',
        name: 'photos.create',
      },
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.store',
        name: 'photos.store',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.show',
        name: 'photos.show',
      },
      {
        pattern: '/photos/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.edit',
        name: 'photos.edit',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.update',
        name: 'photos.update',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.destroy',
        name: 'photos.destroy',
      },
    ])
  })

  test('prepend name to the route resource', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    const group = new RouteGroup([resource])
    group.as('v1')

    assert.deepEqual(toRoutesJSON(group.routes), [
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.index',
        name: 'v1.photos.index',
      },
      {
        pattern: '/photos/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.create',
        name: 'v1.photos.create',
      },
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.store',
        name: 'v1.photos.store',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.show',
        name: 'v1.photos.show',
      },
      {
        pattern: '/photos/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.edit',
        name: 'v1.photos.edit',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.update',
        name: 'v1.photos.update',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.destroy',
        name: 'v1.photos.destroy',
      },
    ])
  })
})
