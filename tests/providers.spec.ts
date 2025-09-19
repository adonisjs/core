/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@adonisjs/application'

import { Repl } from '../modules/repl.ts'
import { Config } from '../modules/config.ts'
import { Emitter } from '../modules/events.ts'
import { Kernel } from '../modules/ace/kernel.ts'
import { TestUtils } from '../src/test_utils/main.ts'
import { Encryption } from '../modules/encryption.ts'
import { Router, Server } from '../modules/http/main.ts'
import { Hash, HashManager } from '../modules/hash/main.ts'
import { Logger, LoggerManager } from '../modules/logger.ts'
import { IgnitorFactory } from '../factories/core/ignitor.ts'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.ts'
import { defineConfig as defineDumperConfig } from '../modules/dumper/define_config.ts'
import { HttpContext } from '@adonisjs/http-server'

const BASE_URL = new URL('./tmp/', import.meta.url)
const BASE_PATH = fileURLToPath(BASE_URL)

test.group('Providers', () => {
  test('ensure all providers have been registered', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.isTrue(app.container.hasBinding('app'))
    assert.isTrue(app.container.hasBinding('ace'))
    assert.isTrue(app.container.hasBinding('logger'))
    assert.isTrue(app.container.hasBinding('config'))
    assert.isTrue(app.container.hasBinding('emitter'))
    assert.isTrue(app.container.hasBinding('encryption'))
    assert.isTrue(app.container.hasBinding('hash'))
    assert.isTrue(app.container.hasBinding('dumper'))
    assert.isTrue(app.container.hasBinding('server'))
    assert.isTrue(app.container.hasBinding('router'))
    assert.isTrue(app.container.hasBinding('testUtils'))
    assert.isTrue(app.container.hasBinding('repl'))
  })

  test('ensure services can resolve bindings using container', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const { default: appService } = await import('../services/app.ts')
    const { default: configService } = await import('../services/config.ts')
    const { default: emitterService } = await import('../services/emitter.ts')
    const { default: encryptionService } = await import('../services/encryption.ts')
    const { default: hashService } = await import('../services/hash.ts')
    const { default: loggerService } = await import('../services/logger.ts')
    const { default: routerService } = await import('../services/router.ts')
    const { default: serverService } = await import('../services/server.ts')
    const { default: aceService } = await import('../services/ace.ts')
    const { default: testUtils } = await import('../services/test_utils.ts')
    const { default: repl } = await import('../services/repl.ts')
    const { dd } = await import('../services/dumper.ts')
    const { urlFor, signedUrlFor } = await import('../services/url_builder.ts')

    assert.instanceOf(aceService, Kernel)
    assert.strictEqual(app, appService)
    assert.instanceOf(configService, Config)
    assert.instanceOf(emitterService, Emitter)
    assert.instanceOf(encryptionService, Encryption)
    assert.instanceOf(hashService, HashManager)
    assert.instanceOf(loggerService, LoggerManager)
    assert.instanceOf(routerService, Router)
    assert.instanceOf(serverService, Server)
    assert.instanceOf(testUtils, TestUtils)
    assert.instanceOf(repl, Repl)
    assert.isFunction(dd)
    assert.strictEqual(urlFor, routerService.urlBuilder.urlFor)
    assert.strictEqual(signedUrlFor, routerService.urlBuilder.signedUrlFor)
    assert.throws(() => dd('d'), 'Dump and Die exception')
  })

  test('construct bodyparser middleware using the container', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const bodyparser = await app.container.make(BodyParserMiddleware)
    assert.instanceOf(bodyparser, BodyParserMiddleware)
  })

  test('construct Hash class using the container', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const hashManger = await app.container.make('hash')

    const hash = await app.container.make(Hash)
    assert.instanceOf(hash, Hash)
    assert.strictEqual(hash, hashManger.use())
  })

  test('construct Logger class using the container', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const loggerService = await app.container.make('logger')

    const logger = await app.container.make(Logger)
    assert.instanceOf(logger, Logger)
    assert.strictEqual(logger, loggerService.use())
  })

  test('register repl methods when repl provider is imported', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('repl')
    await app.init()
    await app.boot()

    const repl = await app.container.make('repl')
    assert.properties(repl.getMethods(), [
      'importDefault',
      'loadApp',
      'loadConfig',
      'loadEncryption',
      'loadHash',
      'loadHelpers',
      'loadRouter',
      'loadTestUtils',
    ])
  })

  test('register providers with side-effects', async () => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: defineConfig({
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
            () => import('../providers/vinejs_provider.js'),
            () => import('../providers/edge_provider.js'),
          ],
        }),
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('repl')
    await app.init()
    await app.boot()
  })

  test('configure dumper using config/app file', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .merge({
        config: {
          app: {
            dumper: defineDumperConfig({
              html: {
                maxArrayLength: 1,
              },
              console: {
                maxArrayLength: 1,
              },
            }),
          },
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const dumper = await app.container.make('dumper')
    assert.include(dumper.dumpToAnsi([1, 2, 3]), '[...2 more items]')
    assert.include(dumper.dumpToHtml([1, 2, 3]), '[...2 more items]')
  })

  test('generate routes JSON and types file once app is ready', async ({ assert, fs }) => {
    fs.baseUrl = BASE_URL
    fs.basePath = BASE_PATH

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
            () => import('../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const router = await app.container.make('router')
    const PostsController = () => import('#controllers/posts_controller' as any)

    router.get('/', () => {})
    router.resource('users', '#controllers/users_controllers')
    router.resource('posts', PostsController)
    router.commit()

    await app.start(() => {})

    await assert.fileContains('.adonisjs/client/routes.json', [
      `"importExpression": "()=>import('#controllers/posts_controller')"`,
      `"importExpression": "#controllers/users_controllers"`,
    ])
    await assert.fileContains('.adonisjs/server/routes.d.ts', [
      `import '@adonisjs/core/types/http'`,
      `declare module '@adonisjs/core/types/http' {`,
      '  type ScannedRoutes = {',
      `export interface RoutesList extends ScannedRoutes {}`,
      `'ALL': {`,
      'users.index',
      'posts.index',
    ])
  })

  test('add transform method to HTTP context', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: defineConfig({
          providers: [() => import('../providers/app_provider.js')],
        }),
      })
      .withCoreConfig()
      .create(BASE_URL)

    const app = ignitor.createApp('repl')
    await app.init()
    await app.boot()

    assert.isFunction(HttpContext.prototype.serialize)
  })
})
