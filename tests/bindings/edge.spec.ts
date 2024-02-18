/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge from 'edge.js'
import { test } from '@japa/runner'

import '../../providers/edge_provider.js'
import { HttpContextFactory } from '../../factories/http.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Bindings | Edge', () => {
  test('register edge globals', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../../providers/app_provider.js'),
            () => import('../../providers/edge_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    assert.equal(edge.globals.config('app.appKey'), 'averylongrandomsecretkey')
    assert.isTrue(edge.globals.config.has('app.appKey'))
    assert.isFalse(edge.globals.config.has('foobar'))
    assert.strictEqual(edge.globals.app, app)

    const router = await app.container.make('router')
    router.get('/users/:id', () => {})
    router.commit()

    assert.equal(edge.globals.route('/users/:id', [1]), '/users/1')
    assert.match(edge.globals.signedRoute('/users/:id', [1]), /\/users\/1\?signature=/)
  })

  test('render template using router', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../../providers/app_provider.js'),
            () => import('../../providers/edge_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    edge.registerTemplate('welcome', {
      template: `Hello {{ username }}`,
    })

    const router = await app.container.make('router')
    router.on('/').render('welcome', { username: 'virk' })
    router.commit()

    const route = router.match('/', 'GET')
    const ctx = new HttpContextFactory().create()

    await route?.route.execute(route.route, app.container.createResolver(), ctx, () => {})
    assert.equal(ctx.response.getBody(), 'Hello virk')
  })
})
