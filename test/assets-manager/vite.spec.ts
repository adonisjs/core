/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { join } from 'path'
import { Application } from '@adonisjs/application'

import { fs } from '../../test-helpers'
import { ViteDriver } from '../../src/AssetsManager/Drivers/Vite'

test.group('Encore Driver', (group) => {
  group.each.setup(async () => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
  })

  group.each.teardown(async () => {
    delete process.env.NODE_ENV

    await fs.cleanup()
  })

  test('raise exception when manifest is used in development or test', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    assert.throws(() => driver.manifest(), 'Cannot use manifest when not in production')
  })

  test('get manifest data in production', async ({ assert }) => {
    process.env.NODE_ENV = 'production'

    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        'index.js': { src: 'index.js' },
      })
    )

    assert.deepEqual(driver.manifest(), {
      'index.js': { src: 'index.js' },
    })
  })

  test('get entrypoints js files', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        url: 'url',
        entrypoints: {
          app: {
            js: ['app.js'],
            css: ['app.css'],
          },
        },
      })
    )

    assert.deepEqual(driver.entryPointJsFiles('app'), ['app.js'])
  })

  test('get entrypoints css files', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        url: 'url',
        entrypoints: {
          app: {
            js: ['app.js'],
            css: ['app.css'],
          },
        },
      })
    )

    assert.deepEqual(driver.entryPointCssFiles('app'), ['app.css'])
  })

  test('raise exception when entrypoint itself is missing', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        url: 'url',
        entrypoints: {},
      })
    )

    assert.throws(
      () => driver.entryPointJsFiles('foo'),
      'Cannot find assets for "foo" entrypoint. Make sure to define it inside the "entryPoints" vite config'
    )
  })

  test('get path for a given asset, should be prefixed with dev server url', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add('public/assets/entrypoints.json', JSON.stringify({ url: 'http://localhost:3000' }))

    assert.equal(driver.assetPath('app.js'), 'http://localhost:3000/app.js')
  })

  test('get path in production should use manifest.json file', async ({ assert }) => {
    process.env.NODE_ENV = 'production'

    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add('public/assets/entrypoints.json', JSON.stringify({ url: 'http://cdn.com' }))

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        'app.js': { file: 'app.545454.js' },
      })
    )

    assert.equal(driver.assetPath('app.js'), 'http://cdn.com/app.545454.js')
  })

  test('raise exception when assetPath used in production and file is missing for manifest', async ({
    assert,
  }) => {
    process.env.NODE_ENV = 'production'

    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new ViteDriver(app)

    await fs.add('public/assets/entrypoints.json', JSON.stringify({ url: 'http://cdn.com' }))

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        'app.js': { file: 'app.545454.js' },
      })
    )

    assert.throws(
      () => driver.assetPath('foo.js'),
      'Cannot find "foo.js" asset in the manifest file'
    )
  })

  test('getViteHmrScript should return the @vite/client script', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    await fs.add('public/assets/entrypoints.json', JSON.stringify({ url: 'http://localhost:5173' }))

    const driver = new ViteDriver(app)

    assert.equal(
      driver.getViteHmrScript(),
      '<script type="module" src="http://localhost:5173/@vite/client"></script>'
    )
  })

  test('getReactHmrScript should returns the markup necessary to enable react hmr', async ({
    assert,
  }) => {
    process.env.NODE_ENV = 'development'

    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    await fs.add('public/assets/entrypoints.json', JSON.stringify({ url: 'http://localhost:5173' }))

    const driver = new ViteDriver(app)

    assert.equal(
      driver.getReactHmrScript(),
      `
    <script type="module">
      import RefreshRuntime from 'http://localhost:5173/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    `
    )
  })
})
