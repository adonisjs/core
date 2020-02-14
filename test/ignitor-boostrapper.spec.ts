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
import { setupApplicationFiles } from '../test-helpers'

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
    await setupApplicationFiles(fs)
    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()

    assert.exists(application.version)
    assert.equal(application.appName, '@adonisjs/core')
  })

  test('register providers by loading app file', async (assert) => {
    await setupApplicationFiles(fs)

    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()
    bootstrapper.registerProviders(false)

    assert.isTrue(application.container.hasBinding('Adonis/Core/Env'), 'has Adonis/Core/Env')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Config'), 'has Adonis/Core/Config')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Profiler'), 'has Adonis/Core/Profiler')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Logger'), 'has Adonis/Core/Logger')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Encryption'), 'has Adonis/Core/Encryption')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Event'), 'has Adonis/Core/Event')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Hash'), 'has Adonis/Core/Hash')

    assert.isTrue(application.container.hasBinding('Adonis/Core/HttpContext'), 'has Adonis/Core/HttpContext')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Request'), 'has Adonis/Core/Request')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Response'), 'has Adonis/Core/Response')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Server'), 'has Adonis/Core/Server')
    assert.isTrue(application.container.hasBinding('Adonis/Core/Route'), 'has Adonis/Core/Route')
    assert.isTrue(application.container.hasBinding('Adonis/Core/MiddlewareStore'), 'has Adonis/Core/MiddlewareStore')

    assert.isTrue(
      application.container.hasBinding('Adonis/Core/BodyParserMiddleware'),
      'has Adonis/Core/BodyParserMiddleware',
    )

    assert.isTrue(application.container.hasBinding('Adonis/Core/Validator'), 'has Adonis/Core/Validator')
    assert.isTrue(
      application.container.hasBinding('Adonis/Core/HttpExceptionHandler'),
      'has Adonis/Core/HttpExceptionHandler',
    )
    assert.isTrue(
      application.container.hasBinding('Adonis/Core/HealthCheck'),
      'has Adonis/Core/HealthCheck',
    )

    const config = application.container.use('Adonis/Core/Config')
    const env = application.container.use('Adonis/Core/Env')
    assert.equal(config.get('app.appKey'), SECRET)
    assert.equal(env.get('APP_KEY'), SECRET)
  })

  test('register aliases defined in adonisrc.json file', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      aliases: {
        'App': './app',
      },
    }))

    const bootstrapper = new Bootstrapper(fs.basePath)
    const application = bootstrapper.setup()
    bootstrapper.registerAliases()

    assert.deepEqual(application.container.autoloads, { App: join(fs.basePath, './app') })
  })

  test('register all preload files when environment is not defined', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: './foo.ts',
        },
        {
          file: './bar.ts',
        },
      ],
    }))

    await fs.add('foo.ts', 'global[\'foo\'] = true')
    await fs.add('bar.ts', 'global[\'bar\'] = true')

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
          file: './foo.ts',
          environment: ['web'],
        },
        {
          file: './bar.ts',
          environment: ['console'],
        },
      ],
    }))

    await fs.add('foo.ts', 'global[\'foo\'] = true')
    await fs.add('bar.ts', 'global[\'bar\'] = true')

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
          file: './foo.ts',
        },
        {
          file: './bar.ts',
        },
      ],
    }))

    await fs.add('foo.ts', '')

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const fn = () => bootstrapper.registerPreloads()
    assert.throw(fn, /ENOENT: no such file or directory/)
  })

  test('do not raise error when preload file is optional and missing', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: './foo.ts',
        },
        {
          file: './bar.ts',
          optional: true,
        },
      ],
    }))

    await fs.add('foo.ts', '')

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()

    const fn = () => bootstrapper.registerPreloads()
    assert.doesNotThrow(fn)
  })

  test('boot providers', async (assert) => {
    await fs.add('providers/AppProvider.ts', `export default class AppProvider {
      public async boot () {
        process.env.APP_PROVIDER_BOOTED = 'true'
      }
    }`)

    await setupApplicationFiles(fs, ['./providers/AppProvider'])

    const bootstrapper = new Bootstrapper(fs.basePath)

    bootstrapper.setup()
    bootstrapper.registerProviders(false)
    await bootstrapper.bootProviders()

    assert.equal(process.env.APP_PROVIDER_BOOTED, 'true')
    delete process.env.APP_PROVIDER_BOOTED
  })

  test('execute ready hooks', async (assert) => {
    await fs.add('providers/AppProvider.ts', `export default class AppProvider {
      public async ready () {
        process.env.APP_PROVIDER_READY = 'true'
      }
    }`)

    await setupApplicationFiles(fs, ['./providers/AppProvider'])

    const bootstrapper = new Bootstrapper(fs.basePath)

    bootstrapper.setup()
    bootstrapper.registerProviders(false)
    await bootstrapper.bootProviders()
    await bootstrapper.executeReadyHooks()

    assert.equal(process.env.APP_PROVIDER_READY, 'true')
    delete process.env.APP_PROVIDER_READY
  })

  test('execute shutdown hooks', async (assert) => {
    await fs.add('providers/AppProvider.ts', `export default class AppProvider {
      public async shutdown () {
        process.env.APP_PROVIDER_SHUTDOWN = 'true'
      }
    }`)

    await setupApplicationFiles(fs, ['./providers/AppProvider'])
    const bootstrapper = new Bootstrapper(fs.basePath)

    bootstrapper.setup()
    bootstrapper.registerProviders(false)
    await bootstrapper.bootProviders()
    await bootstrapper.executeShutdownHooks()

    assert.equal(process.env.APP_PROVIDER_SHUTDOWN, 'true')
    delete process.env.APP_PROVIDER_SHUTDOWN
  })

  test('bodyparser decorate http request with file and files method', async (assert) => {
    await setupApplicationFiles(fs)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()
    bootstrapper.registerProviders(false)
    await bootstrapper.bootProviders()

    const Request = bootstrapper.application.container.use('Adonis/Core/Request')
    assert.isTrue(Request.hasMacro('file'), 'has macro file')
    assert.isTrue(Request.hasMacro('files'), 'has macro files')
  })

  test('validator decorate http request with validate method', async (assert) => {
    await setupApplicationFiles(fs)

    const bootstrapper = new Bootstrapper(fs.basePath)
    bootstrapper.setup()
    bootstrapper.registerProviders(false)
    await bootstrapper.bootProviders()

    const Request = bootstrapper.application.container.use('Adonis/Core/Request')
    assert.isTrue(Request.hasMacro('validate'), 'has macro validate')
  })
})
