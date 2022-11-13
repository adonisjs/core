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
import { EncoreDriver } from '../../src/AssetsManager/Drivers/Encore'

import { fs } from '../../test-helpers'

test.group('Encore Driver', (group) => {
  group.each.setup(async () => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
  })

  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('raise exception when manifest.json file is missing', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()
    const driver = new EncoreDriver(app)

    assert.throws(
      () => driver.manifest(),
      `Cannot find "${app.publicPath('assets/manifest.json')}"`
    )
  })

  test('raise exception when entrypoints.json file is missing', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()
    const driver = new EncoreDriver(app)

    assert.throws(
      () => driver.entryPoints(),
      `Cannot find "${app.publicPath('assets/entrypoints.json')}"`
    )
  })

  test('get manifest data', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        'app.js': './app.js',
      })
    )

    assert.deepEqual(driver.manifest(), { 'app.js': './app.js' })
  })

  test('get entrypoints data', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {
          app: {
            js: ['./app.js'],
          },
        },
      })
    )

    assert.deepEqual(driver.entryPoints(), {
      app: {
        js: ['./app.js'],
      },
    })
  })

  test('get entrypoints js files', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {
          app: {
            js: ['./app.js'],
          },
        },
      })
    )

    assert.deepEqual(driver.entryPointJsFiles('app'), ['./app.js'])
  })

  test('get entrypoints css files', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {
          app: {
            css: ['./app.css'],
          },
        },
      })
    )

    assert.deepEqual(driver.entryPointCssFiles('app'), ['./app.css'])
  })

  test('get empty array when js files are not in defined', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {
          app: {},
        },
      })
    )

    assert.deepEqual(driver.entryPointJsFiles('app'), [])
  })

  test('get empty array when css files are not in defined', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {
          app: {},
        },
      })
    )

    assert.deepEqual(driver.entryPointCssFiles('app'), [])
  })

  test('raise exception when entrypoint itself is missing', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {},
      })
    )

    assert.throws(
      () => driver.entryPointJsFiles('app'),
      'Cannot find assets for "app" entrypoint. Make sure you are compiling assets'
    )

    assert.throws(
      () => driver.entryPointCssFiles('app'),
      'Cannot find assets for "app" entrypoint. Make sure you are compiling assets'
    )
  })

  test('get path for a given asset', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        './app.js': './app-123.js',
      })
    )
    assert.equal(driver.assetPath('./app.js'), './app-123.js')
  })

  test('raise exception when asset path is missing', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const driver = new EncoreDriver(app)

    await fs.add('public/assets/manifest.json', JSON.stringify({}))

    assert.throws(
      () => driver.assetPath('app'),
      'Cannot find path for "app" asset. Make sure you are compiling assets'
    )
  })
})
