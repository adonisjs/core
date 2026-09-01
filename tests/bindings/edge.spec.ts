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
import { Qs } from '../../modules/http/main.ts'
import { HttpContextFactory } from '../../factories/http.ts'
import { IgnitorFactory } from '../../factories/core/ignitor.ts'

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

    assert.equal(edge.globals.config('app.appUrl'), 'http://localhost:3333')
    assert.isTrue(edge.globals.config.has('app.appUrl'))
    assert.isFalse(edge.globals.config.has('foobar'))
    assert.strictEqual(edge.globals.app, app)
    assert.instanceOf(edge.globals.qs, Qs)
    assert.equal(edge.globals.number.clamp(15, 0, 10), 10)

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

    const route = router.match('/', 'GET', false)
    const ctx = new HttpContextFactory().create()

    await route?.route.execute(route.route, app.container.createResolver(), ctx, () => {})
    assert.equal(ctx.response.getBody(), 'Hello virk')
  })

  test('use number helpers inside templates', async ({ assert }) => {
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

    edge.registerTemplate('score', {
      template: `{{ number.clamp(score, 0, 10) }} {{ number.between(score, 0, 10) }} {{ number.toFinite(raw, 0) }} {{ number.parse(valid) }}`,
    })

    const html = await edge.render('score', { score: 15, raw: 'abc', valid: '8' })
    assert.equal(html, '10 false 0 8')
  })

  test('make form action using formAttributes helper', async ({ assert }) => {
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

    const router = await app.container.make('router')
    router.get('/users/:id', () => {}).as('users.show')
    router.commit()

    assert.deepEqual(edge.globals.formAttributes('users.show', { id: 1 }), {
      action: '/users/1',
      method: 'GET',
    })
  })

  test('make action via method spoofing', async ({ assert }) => {
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

    const router = await app.container.make('router')
    router.put('/users/:id', () => {}).as('users.update')
    router.commit()

    assert.deepEqual(edge.globals.formAttributes('users.update', { id: 1 }), {
      action: '/users/1?_method=PUT',
      method: 'POST',
    })
  })

  test('make action via method spoofing and append to existing query string', async ({
    assert,
  }) => {
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

    const router = await app.container.make('router')
    router.put('/users/:id', () => {}).as('users.update')
    router.commit()
    const options = {
      qs: {
        view: 'card',
      },
    }

    assert.deepEqual(edge.globals.formAttributes('users.update', { id: 1 }, options), {
      action: '/users/1?_method=PUT&view=card',
      method: 'POST',
    })

    /**
     * Making sure we do not mutate the options internally
     */
    assert.deepEqual(options, {
      qs: {
        view: 'card',
      },
    })
  })

  test('share routes with names with edge', async ({ assert }) => {
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

    const UsersController = () => import('#controllers/users_controller' as any)

    const router = await app.container.make('router')
    router.get('/users/:id', () => {})
    router.get('/users', [UsersController, 'index'])
    router.commit()

    assert
      .snapshot(edge.globals.routesJSON())
      .matchInline(
        '"{\\"root\\":[{\\"domain\\":\\"root\\",\\"methods\\":[\\"GET\\",\\"HEAD\\"],\\"pattern\\":\\"/users\\",\\"tokens\\":[{\\"old\\":\\"/users\\",\\"type\\":0,\\"val\\":\\"users\\",\\"end\\":\\"\\"}],\\"name\\":\\"users.index\\"}]}"'
      )
  })
})
