/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'

import { Bootstrapper } from '../src/Ignitor/Bootstrapper'

const fs = new Filesystem(join(__dirname, '__app'))
const SECRET = 'asecureandlongrandomsecret'

test.group('Ignitor | Setup', (group) => {
  group.before(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.beforeEach(() => {
    process.env.NODE_ENV = 'testing'
  })

  group.after(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.afterEach(async () => {
    delete process.env.NODE_ENV
    await fs.cleanup()
  })

  test('setup application', async (assert) => {
    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()

    assert.exists(application.version)
    assert.equal(application.appName, '@adonisjs/core')
  })

  test('register providers by loading app file', async (assert) => {
    await fs.add(`start/app.ts`, `export const providers = [
      '${join(__dirname, '../providers/AppProvider.ts')}'
    ]`)

    await fs.add(`config/app.ts`, `
      const Env = global[Symbol.for('ioc.use')]('Adonis/Core/Env')
      export const appKey = Env.get('APP_KEY')
    `)

    await fs.add(`.env`, `APP_KEY=${SECRET}`)

    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()
    bootstrapper.registerProviders(false)

    assert.deepEqual(
      application.container.use('Adonis/Core/Config'),
      application.container.use('Adonis/Core/Config'),
    )

    assert.deepEqual(
      application.container.use('Adonis/Core/Env'),
      application.container.use('Adonis/Core/Env'),
    )

    assert.deepEqual(
      application.container.use('Adonis/Core/Route'),
      application.container.use('Adonis/Core/Route'),
    )

    assert.deepEqual(
      application.container.use('Adonis/Core/Server'),
      application.container.use('Adonis/Core/Server'),
    )

    assert.deepEqual(
      application.container.use('Adonis/Core/MiddlewareStore'),
      application.container.use('Adonis/Core/MiddlewareStore'),
    )

    const config = application.container.use('Adonis/Core/Config')
    const env = application.container.use('Adonis/Core/Env')

    assert.equal(config.get('app.appKey'), SECRET)
    assert.equal(env.get('APP_KEY'), SECRET)
  })

  test('raise exception when providers array is missing in app file', async (assert) => {
    await fs.add(`start/app.ts`, ``)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const fn = () => bootstrapper.registerProviders(false)
    assert.throw(fn, 'E_MISSING_APP_ESSENTIALS: export `providers` array from start/app file')
  })

  test('return all whitelist exports from app file', async (assert) => {
    await fs.add(`start/app.ts`, `
      export const providers = ['foo']
      export const aceProviders = ['foo-ace']
      export const commands = ['foo-command']
    `)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const appFile = bootstrapper.getAppFileContents()
    assert.deepEqual(appFile, {
      providers: ['foo'],
      aceProviders: ['foo-ace'],
      aliases: {},
      commands: ['foo-command'],
    })
  })

  test('register autoloads defined in adonisrc.json file', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      autoloads: {
        'App': './app',
      },
    }))

    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()
    bootstrapper.registerAutoloads()

    assert.deepEqual(application.container.autoloads, { App: join(fs.basePath, './app') })
  })

  test('register all preload files when environment is not defined', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'foo.ts',
        },
        {
          file: 'bar.ts',
        },
      ],
    }))

    await fs.add('foo.ts', `global['foo'] = true`)
    await fs.add('bar.ts', `global['bar'] = true`)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()
    bootstrapper.registerPreloads()

    assert.isTrue(global['foo'])
    assert.isTrue(global['bar'])

    delete global['foo']
    delete global['bar']
  })

  test('register all preload files for a given environment only', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'foo.ts',
          environment: ['web'],
        },
        {
          file: 'bar.ts',
          environment: ['console'],
        },
      ],
    }))

    await fs.add('foo.ts', `global['foo'] = true`)
    await fs.add('bar.ts', `global['bar'] = true`)

    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()
    application.environment = 'web'

    bootstrapper.registerPreloads()

    assert.isTrue(global['foo'])
    assert.isUndefined(global['bar'])

    delete global['foo']
    delete global['bar']
  })

  test('raise error when preload file is missing', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'foo.ts',
        },
        {
          file: 'bar.ts',
        },
      ],
    }))

    await fs.add('foo.ts', ``)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const fn = () => bootstrapper.registerPreloads()
    assert.throw(fn, /ENOENT: no such file or directory/)
  })

  test('do not raise error when preload file is optional', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'foo.ts',
        },
        {
          file: 'bar.ts',
          optional: true,
        },
      ],
    }))

    await fs.add('foo.ts', ``)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const fn = () => bootstrapper.registerPreloads()
    assert.doesNotThrow(fn)
  })
})
