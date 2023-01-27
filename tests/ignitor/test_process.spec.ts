/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { IgnitorFactory } from '../../test_factories/ignitor.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Ignitor | Test process', () => {
  test('start application in test environment', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    await ignitor.testRunner().run(() => {})
    assert.equal(ignitor.getApp()?.getEnvironment(), 'test')
    assert.equal(ignitor.getApp()?.getState(), 'ready')
  })

  test('call configure method before starting the app', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    await ignitor
      .testRunner()
      .configure((app) => {
        assert.equal(app.getState(), 'booted')
      })
      .run(() => {})
    assert.equal(ignitor.getApp()?.getEnvironment(), 'test')
    assert.equal(ignitor.getApp()?.getState(), 'ready')
  })
})
