/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { defineConfig } from '@adonisjs/application'

import { Repl } from '../modules/repl.js'
import { Config } from '../modules/config.js'
import { Emitter } from '../modules/events.js'
import { Kernel } from '../modules/ace/kernel.js'
import { TestUtils } from '../src/test_utils/main.js'
import { Encryption } from '../modules/encryption.js'
import { Router, Server } from '../modules/http/main.js'
import { Hash, HashManager } from '../modules/hash/main.js'
import { Logger, LoggerManager } from '../modules/logger.js'
import { IgnitorFactory } from '../factories/core/ignitor.js'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

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

    const { default: appService } = await import('../services/app.js')
    const { default: configService } = await import('../services/config.js')
    const { default: emitterService } = await import('../services/emitter.js')
    const { default: encryptionService } = await import('../services/encryption.js')
    const { default: hashService } = await import('../services/hash.js')
    const { default: loggerService } = await import('../services/logger.js')
    const { default: routerService } = await import('../services/router.js')
    const { default: serverService } = await import('../services/server.js')
    const { default: aceService } = await import('../services/ace.js')
    const { default: testUtils } = await import('../services/test_utils.js')
    const { default: repl } = await import('../services/repl.js')

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
})
