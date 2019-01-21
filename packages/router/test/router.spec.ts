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
      domain: 'root',
      handler: 'HomeController.index',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(postRoute.toJSON(), {
      pattern: '/',
      methods: ['POST'],
      matchers: {},
      domain: 'root',
      handler: 'HomeController.store',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(putRoute.toJSON(), {
      pattern: '/',
      methods: ['PUT'],
      matchers: {},
      domain: 'root',
      handler: 'HomeController.update',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(patchRoute.toJSON(), {
      pattern: '/',
      methods: ['PATCH'],
      matchers: {},
      domain: 'root',
      handler: 'HomeController.updatePatch',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(destroyRoute.toJSON(), {
      pattern: '/',
      methods: ['DELETE'],
      matchers: {},
      domain: 'root',
      handler: 'HomeController.destroy',
      middleware: [],
      name: undefined,
    })

    assert.deepEqual(anyRoute.toJSON(), {
      pattern: '/',
      methods: ['HEAD', 'OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      matchers: {},
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
                middleware: [],
                name: undefined,
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
                middleware: [],
                name: undefined,
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
                middleware: [],
                name: 'posts.index',
              },
              '/api/posts/create': {
                pattern: '/api/posts/create',
                handler: 'PostController.create',
                middleware: [],
                name: 'posts.create',
              },
              '/api/posts/:id': {
                pattern: '/api/posts/:id',
                handler: 'PostController.show',
                middleware: [],
                name: 'posts.show',
              },
              '/api/posts/:id/edit': {
                pattern: '/api/posts/:id/edit',
                handler: 'PostController.edit',
                middleware: [],
                name: 'posts.edit',
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
                middleware: [],
                name: 'posts.store',
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
                middleware: [],
                name: 'posts.update',
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
                middleware: [],
                name: 'posts.update',
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
                middleware: [],
                name: 'posts.destroy',
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
                middleware: [],
                name: 'posts.comments.index',
              },
              '/posts/:post_id/comments/create': {
                pattern: '/posts/:post_id/comments/create',
                handler: 'CommentsController.create',
                middleware: [],
                name: 'posts.comments.create',
              },
              '/comments/:id': {
                pattern: '/comments/:id',
                handler: 'CommentsController.show',
                middleware: [],
                name: 'comments.show',
              },
              '/comments/:id/edit': {
                pattern: '/comments/:id/edit',
                handler: 'CommentsController.edit',
                middleware: [],
                name: 'comments.edit',
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
                middleware: [],
                name: 'posts.comments.store',
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
                middleware: [],
                name: 'comments.update',
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
                middleware: [],
                name: 'comments.update',
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
                middleware: [],
                name: 'comments.destroy',
              },
            },
          },
        },
      },
    })
  })

  test('do not commit route when deleted flag is set to true', (assert) => {
    const router = new Router()

    function handler () {}
    const route = router.get('/', handler)
    route.deleted = true

    router.commit()

    assert.deepEqual(router['_store'].tree, {
      tokens: [],
      domains: {},
    })
  })
})
