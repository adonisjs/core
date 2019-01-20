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
})
