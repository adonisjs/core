/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { IgnitorFactory } from '../factories/core/ignitor.js'
import { detectAssetsBundler } from '../src/internal_helpers.js'

test.group('Internal helpers | detect package manager', () => {
  test('return "vite" when vite.config.js file exists', async ({ fs, assert }) => {
    const app = new IgnitorFactory()
      .create(fs.baseUrl, {
        importer: () => {},
      })
      .createApp('web')

    await app.init()
    await fs.create('vite.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'vite',
      buildCommand: 'vite build',
      devServerCommand: 'vite',
    })
  })

  test('return "encore" when webpack.config.js file exists', async ({ fs, assert }) => {
    const app = new IgnitorFactory()
      .create(fs.baseUrl, {
        importer: () => {},
      })
      .createApp('web')

    await app.init()
    await fs.create('webpack.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'encore',
      buildCommand: 'encore',
      devServerCommand: 'encore dev-server',
    })
  })

  test('return undefined when unable to detect', async ({ fs, assert }) => {
    const app = new IgnitorFactory()
      .create(fs.baseUrl, {
        importer: () => {},
      })
      .createApp('web')

    await app.init()
    assert.isUndefined(await detectAssetsBundler(app))
  })

  test('use explicit assetsBundler over detection', async ({ fs, assert }) => {
    const app = new IgnitorFactory()
      .create(fs.baseUrl, {
        importer: () => {},
      })
      .createApp('web')

    app.rcContents({
      assetsBundler: {
        name: 'webpack',
        buildCommand: 'webpack',
        devServerCommand: 'webpack dev-server',
      },
    })
    await app.init()

    await fs.create('webpack.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'webpack',
      buildCommand: 'webpack',
      devServerCommand: 'webpack dev-server',
    })
  })
})
