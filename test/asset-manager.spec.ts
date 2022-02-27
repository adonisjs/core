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

import { AssetsManager } from '../src/AssetsManager'
import { EncoreDriver } from '../src/AssetsManager/Drivers/Encore'

import { fs } from '../test-helpers'

test.group('AssetsManager', (group) => {
  group.each.setup(async () => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))
  })

  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('get asset tag using the manager', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager({}, app)

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

    assert.equal(manager.entryPointScriptTags('app'), '<script src="./app.js"></script>')
  })

  test('apply custom attributes to the script tag', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager(
      {
        script: {
          attributes: {
            defer: true,
          },
        },
      },
      app
    )

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

    assert.equal(manager.entryPointScriptTags('app'), '<script src="./app.js" defer></script>')
  })

  test('get style tag using the manager', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager({}, app)

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

    assert.equal(manager.entryPointStyleTags('app'), '<link rel="stylesheet" href="./app.css" />')
  })

  test('raise exception when using unknown driver', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager({ driver: 'vite' }, app)

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

    assert.throws(
      () => manager.entryPointStyleTags('app'),
      'Invalid asset driver "vite". Make sure to register the driver using the "AssetsManager.extend" method'
    )
  })

  test('register custom driver', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager({ driver: 'vite' }, app)
    class ViteDriver extends EncoreDriver {
      public entryPointJsFiles() {
        return ['./vite-app.js']
      }
    }

    manager.extend('vite', ($manager) => new ViteDriver($manager.application))

    await fs.add(
      'public/assets/entrypoints.json',
      JSON.stringify({
        entrypoints: {},
      })
    )

    assert.equal(manager.entryPointScriptTags('app'), '<script src="./vite-app.js"></script>')
  })

  test('get assets version', async ({ assert }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager(
      {
        script: {
          attributes: {
            defer: true,
          },
        },
      },
      app
    )

    await fs.add(
      'public/assets/manifest.json',
      JSON.stringify({
        app: './app.js',
      })
    )

    assert.equal(manager.version, 'c46a678581')
  })

  test("raise exception when using entrypoints and driver doesn't support it", async ({
    assert,
  }) => {
    const app = new Application(fs.basePath, 'test', {})
    await app.setup()

    const manager = new AssetsManager({ driver: 'vite' }, app)
    class ViteDriver extends EncoreDriver {
      public hasEntrypoints = false
      public name = 'vite'
    }

    manager.extend('vite', ($manager) => new ViteDriver($manager.application))
    assert.throws(
      () => manager.entryPointScriptTags('app'),
      'Cannot reference entrypoints. The "vite" driver does not support entrypoints'
    )
  })
})
