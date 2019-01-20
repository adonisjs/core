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
      },
      {
        pattern: '/photos/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.create',
      },
      {
        pattern: '/photos',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.store',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.show',
      },
      {
        pattern: '/photos/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.edit',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.update',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.destroy',
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
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.store',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.update',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
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
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {},
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.store',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
      },
      {
        pattern: '/ads/:id/edit',
        matchers: {},
        meta: {},
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.update',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {},
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
      },
    ])
  })
})
