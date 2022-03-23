/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { fs, setupApp } from '../test-helpers'
import { HealthCheck } from '../src/HealthCheck'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'

test.group('App Provider', (group) => {
  group.each.teardown(async () => {
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')
    await fs.cleanup()
  })

  test('register app provider', async ({ assert }) => {
    const app = await setupApp([], true)
    assert.isTrue(app.container.hasBinding('Adonis/Core/Env'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Config'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Logger'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Encryption'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Profiler'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Request'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Response'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Server'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/MiddlewareStore'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/HttpContext'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Event'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Hash'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/BodyParser'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/Validator'))
    assert.isTrue(app.container.hasBinding('Adonis/Core/AssetsManager'))
    assert.instanceOf(app.container.use('Adonis/Core/HealthCheck'), HealthCheck)
    assert.deepEqual(
      app.container.use('Adonis/Core/HttpExceptionHandler'),
      HttpExceptionHandler as any
    )

    /**
     * Ensure drive routes are registerd
     */
    const router = app.container.use('Adonis/Core/Route')
    router.commit()
    const routes = router.toJSON()

    assert.deepEqual(routes.root[0].name, 'drive.local.serve')
    assert.deepEqual(routes.root[0].pattern, '/uploads/*')
  })

  test('extend Japa ApiRequest', async ({ assert }) => {
    const app = await setupApp(['@japa/preset-adonis/TestsProvider'], true)
    const ApiRequest = app.container.use('Japa/Preset/ApiRequest')
    assert.isTrue(ApiRequest.hasMacro('encryptedCookie'))
    assert.isTrue(ApiRequest.hasMacro('plainCookie'))
  })
})
