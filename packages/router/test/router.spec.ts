/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Router } from '../src/Router'

test.group('Router', () => {
  test('add routes', (assert) => {
    const router = new Router()

    const getRoute = router.get('/', 'HomeController.index')
    const postRoute = router.post('/', 'HomeController.store')
    const putRoute = router.put('/', 'HomeController.update')
    const patchRoute = router.patch('/', 'HomeController.updatePatch')
    const destroyRoute = router.destroy('/', 'HomeController.destroy')
    const anyRoute = router.any('/', 'HomeController.handle')

    assert.deepEqual(getRoute.toJSON(), {
      pattern: '/',
      methods: ['GET'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.index',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(postRoute.toJSON(), {
      pattern: '/',
      methods: ['POST'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.store',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(putRoute.toJSON(), {
      pattern: '/',
      methods: ['PUT'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.update',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(patchRoute.toJSON(), {
      pattern: '/',
      methods: ['PATCH'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.updatePatch',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(destroyRoute.toJSON(), {
      pattern: '/',
      methods: ['DELETE'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.destroy',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(anyRoute.toJSON(), {
      pattern: '/',
      methods: ['HEAD', 'OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      matchers: {},
      meta: {},
      domain: 'root',
      handler: 'HomeController.handle',
      middleware: [],
      name: undefined,
    })
  })

  test('raise error when route name is duplicate', (assert) => {
    const router = new Router()

    router.get('/', function handler () {}).as('home')
    router.get('home', function handler () {}).as('home')

    const fn = () => router.commit()
    assert.throw(fn, 'Duplicate route name `home`')
  })

  test('commit routes to the store', (assert) => {
    const router = new Router()

    function handler () {}
    router.get('/', handler)
    router.commit()

    assert.deepEqual(router['_store'].tree, {
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
                handler,
                matchers: {},
                middleware: [],
                name: undefined,
                meta: {},
              },
            },
          },
        },
      },
    })
  })

  test('commit routes group to the store', (assert) => {
    const router = new Router()

    function handler () {}
    router.group(() => {
      router.get('/', handler)
    }).prefix('api')

    router.commit()

    assert.deepEqual(router['_store'].tree, {
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
              old: '/api',
              type: 0,
              val: 'api',
              end: '',
            }]],
            routes: {
              '/api': {
                pattern: '/api',
                handler,
                matchers: {},
                middleware: [],
                name: undefined,
                meta: {},
              },
            },
          },
        },
      },
    })
  })

  test('define resource inside a group', (assert) => {
    const router = new Router()

    router.group(() => {
      router.resource('posts', 'PostController')
    }).prefix('api')

    router.commit()

    assert.deepEqual(router['_store'].tree, {
      tokens: [[{
        old: 'root',
        type: 0,
        val: 'root',
        end: '',
      }]],
      domains: {
        'root': {
          'GET': {
            tokens: [
              [
                {
                  old: '/api/posts',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
              ],
              [
                {
                  old: '/api/posts/create',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/create',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/create',
                  type: 0,
                  val: 'create',
                  end: '',
                },
              ],
              [
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
              [
                {
                  old: '/api/posts/:id/edit',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/:id/edit',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/:id/edit',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
                {
                  old: '/api/posts/:id/edit',
                  type: 0,
                  val: 'edit',
                  end: '',
                },
              ],
            ],
            routes: {
              '/api/posts': {
                pattern: '/api/posts',
                handler: 'PostController.index',
                matchers: {},
                middleware: [],
                name: 'posts.index',
                meta: {},
              },
              '/api/posts/create': {
                pattern: '/api/posts/create',
                handler: 'PostController.create',
                matchers: {},
                middleware: [],
                name: 'posts.create',
                meta: {},
              },
              '/api/posts/:id': {
                pattern: '/api/posts/:id',
                handler: 'PostController.show',
                matchers: {},
                middleware: [],
                name: 'posts.show',
                meta: {},
              },
              '/api/posts/:id/edit': {
                pattern: '/api/posts/:id/edit',
                handler: 'PostController.edit',
                matchers: {},
                middleware: [],
                name: 'posts.edit',
                meta: {},
              },
            },
          },
          'POST': {
            tokens: [
              [
                {
                  old: '/api/posts',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
              ],
            ],
            routes: {
              '/api/posts': {
                pattern: '/api/posts',
                handler: 'PostController.store',
                matchers: {},
                middleware: [],
                name: 'posts.store',
                meta: {},
              },
            },
          },
          'PUT': {
            tokens: [
              [
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/api/posts/:id': {
                pattern: '/api/posts/:id',
                handler: 'PostController.update',
                matchers: {},
                middleware: [],
                name: 'posts.update',
                meta: {},
              },
            },
          },
          'PATCH': {
            tokens: [
              [
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/api/posts/:id': {
                pattern: '/api/posts/:id',
                handler: 'PostController.update',
                matchers: {},
                middleware: [],
                name: 'posts.update',
                meta: {},
              },
            },
          },
          'DELETE': {
            tokens: [
              [
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'api',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/api/posts/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/api/posts/:id': {
                pattern: '/api/posts/:id',
                handler: 'PostController.destroy',
                matchers: {},
                middleware: [],
                name: 'posts.destroy',
                meta: {},
              },
            },
          },
        },
      },
    })
  })

  test('define shallow resource', (assert) => {
    const router = new Router()

    router.shallowResource('posts.comments', 'CommentsController')
    router.commit()

    assert.deepEqual(router['_store'].tree, {
      tokens: [[{
        old: 'root',
        type: 0,
        val: 'root',
        end: '',
      }]],
      domains: {
        'root': {
          'GET': {
            tokens: [
              [
                {
                  old: '/posts/:post_id/comments',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments',
                  type: 1,
                  val: 'post_id',
                  matcher: undefined,
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
              ],
              [
                {
                  old: '/posts/:post_id/comments/create',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments/create',
                  type: 1,
                  val: 'post_id',
                  end: '',
                  matcher: undefined,
                },
                {
                  old: '/posts/:post_id/comments/create',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments/create',
                  type: 0,
                  val: 'create',
                  end: '',
                },
              ],
              [
                {
                  old: '/comments/:id',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/comments/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
              [
                {
                  old: '/comments/:id/edit',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/comments/:id/edit',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
                {
                  old: '/comments/:id/edit',
                  type: 0,
                  val: 'edit',
                  end: '',
                },
              ],
            ],
            routes: {
              '/posts/:post_id/comments': {
                pattern: '/posts/:post_id/comments',
                handler: 'CommentsController.index',
                matchers: {},
                middleware: [],
                name: 'posts.comments.index',
                meta: {},
              },
              '/posts/:post_id/comments/create': {
                pattern: '/posts/:post_id/comments/create',
                handler: 'CommentsController.create',
                matchers: {},
                middleware: [],
                name: 'posts.comments.create',
                meta: {},
              },
              '/comments/:id': {
                pattern: '/comments/:id',
                handler: 'CommentsController.show',
                matchers: {},
                middleware: [],
                name: 'comments.show',
                meta: {},
              },
              '/comments/:id/edit': {
                pattern: '/comments/:id/edit',
                handler: 'CommentsController.edit',
                matchers: {},
                middleware: [],
                name: 'comments.edit',
                meta: {},
              },
            },
          },
          'POST': {
            tokens: [
              [
                {
                  old: '/posts/:post_id/comments',
                  type: 0,
                  val: 'posts',
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments',
                  type: 1,
                  val: 'post_id',
                  matcher: undefined,
                  end: '',
                },
                {
                  old: '/posts/:post_id/comments',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
              ],
            ],
            routes: {
              '/posts/:post_id/comments': {
                pattern: '/posts/:post_id/comments',
                handler: 'CommentsController.store',
                matchers: {},
                middleware: [],
                name: 'posts.comments.store',
                meta: {},
              },
            },
          },
          'PUT': {
            tokens: [
              [
                {
                  old: '/comments/:id',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/comments/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/comments/:id': {
                pattern: '/comments/:id',
                handler: 'CommentsController.update',
                matchers: {},
                middleware: [],
                name: 'comments.update',
                meta: {},
              },
            },
          },
          'PATCH': {
            tokens: [
              [
                {
                  old: '/comments/:id',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/comments/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/comments/:id': {
                pattern: '/comments/:id',
                handler: 'CommentsController.update',
                matchers: {},
                middleware: [],
                name: 'comments.update',
                meta: {},
              },
            },
          },
          'DELETE': {
            tokens: [
              [
                {
                  old: '/comments/:id',
                  type: 0,
                  val: 'comments',
                  end: '',
                },
                {
                  old: '/comments/:id',
                  type: 1,
                  val: 'id',
                  end: '',
                  matcher: undefined,
                },
              ],
            ],
            routes: {
              '/comments/:id': {
                pattern: '/comments/:id',
                handler: 'CommentsController.destroy',
                matchers: {},
                middleware: [],
                name: 'comments.destroy',
                meta: {},
              },
            },
          },
        },
      },
    })
  })
})
