/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { RouteResource } from '../src/Resource'

test.group('Router', () => {
  test('add base resource routes', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.index',
        name: undefined,
      },
      {
        pattern: '/photos/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.create',
        name: undefined,
      },
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.store',
        name: undefined,
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.show',
        name: undefined,
      },
      {
        pattern: '/photos/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.edit',
        name: undefined,
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.update',
        name: undefined,
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.destroy',
        name: undefined,
      },
    ])
  })

  test('add base nested resource routes', (assert) => {
    const resource = new RouteResource('magazines.ads', 'AdsController', {}, false)

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.index',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.store',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.update',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
        name: undefined,
      },
    ])
  })

  test('add shallow nested resource routes', (assert) => {
    const resource = new RouteResource('magazines.ads', 'AdsController', {}, true)

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.index',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
        name: undefined,
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.store',
        name: undefined,
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
        name: undefined,
      },
      {
        pattern: '/ads/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
        name: undefined,
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.update',
        name: undefined,
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
        name: undefined,
      },
    ])
  })
})
