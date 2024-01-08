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
  test('return "vite" when vite.config.* file exists', async ({ fs, assert }) => {
    const app = new IgnitorFactory().create(fs.baseUrl).createApp('web')

    await app.init()
    await fs.create('vite.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'vite',
      devServer: { command: 'vite' },
      build: { command: 'vite', args: ['build'] },
    })
    await fs.remove('vite.config.js')

    await fs.create('vite.config.ts', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'vite',
      devServer: { command: 'vite' },
      build: { command: 'vite', args: ['build'] },
    })
  })

  test('return "encore" when webpack.config.* file exists', async ({ fs, assert }) => {
    const app = new IgnitorFactory().create(fs.baseUrl).createApp('web')

    await app.init()
    await fs.create('webpack.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'encore',
      devServer: { command: 'encore', args: ['dev-server'] },
      build: { command: 'encore', args: ['production'] },
    })
    await fs.remove('webpack.config.js')

    await fs.create('webpack.config.cjs', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'encore',
      devServer: { command: 'encore', args: ['dev-server'] },
      build: { command: 'encore', args: ['production'] },
    })
  })

  test('return undefined when unable to detect', async ({ fs, assert }) => {
    const app = new IgnitorFactory().create(fs.baseUrl).createApp('web')

    await app.init()
    assert.isUndefined(await detectAssetsBundler(app))
  })

  test('use explicit assetsBundler over detection', async ({ fs, assert }) => {
    const app = new IgnitorFactory().create(fs.baseUrl).createApp('web')

    app.rcContents({
      assetsBundler: {
        name: 'webpack',
        build: { command: 'webpack' },
        devServer: { command: 'webpack dev-server' },
      },
    })
    await app.init()

    await fs.create('webpack.config.js', '')
    assert.deepEqual(await detectAssetsBundler(app), {
      name: 'webpack',
      build: { command: 'webpack' },
      devServer: { command: 'webpack dev-server' },
    })
  })
})
