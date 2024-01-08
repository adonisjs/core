/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import is from '../../src/helpers/is.js'
import stringHelpers from '../../src/helpers/string.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'
import AppServiceProvider from '../../providers/app_provider.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Bindings | Repl', () => {
  test('load services to REPL context', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../../providers/app_provider.js'),
            () => import('../../providers/hash_provider.js'),
            () => import('../../providers/repl_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, {
        importer(filePath: string) {
          return import(new URL(filePath, new URL('../', import.meta.url)).href)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    app.makeURL()

    /**
     * Setting up REPL with fake server
     * and context
     */
    const repl = await app.container.make('repl')
    repl.server = {
      context: {},
      displayPrompt() {},
    } as any

    /**
     * Define REPL bindings
     */
    // await new ReplServiceProvider(app).boot()
    const methods = repl.getMethods()

    await methods.loadEncryption.handler(repl)
    assert.deepEqual(repl.server!.context.encryption, await app.container.make('encryption'))

    await methods.loadApp.handler(repl)
    assert.deepEqual(repl.server!.context.app, await app.container.make('app'))

    await methods.loadHash.handler(repl)
    assert.deepEqual(repl.server!.context.hash, await app.container.make('hash'))

    await methods.loadRouter.handler(repl)
    assert.deepEqual(repl.server!.context.router, await app.container.make('router'))

    await methods.loadConfig.handler(repl)
    assert.deepEqual(repl.server!.context.config, await app.container.make('config'))

    await methods.loadTestUtils.handler(repl)
    assert.deepEqual(repl.server!.context.testUtils, await app.container.make('testUtils'))

    await methods.loadHelpers.handler(repl)
    assert.deepEqual(repl.server!.context.helpers.string, stringHelpers)
    assert.deepEqual(repl.server!.context.helpers.is, is)

    const output = await methods.importDefault.handler(repl, '../providers/app_provider.js')
    assert.deepEqual(output, AppServiceProvider)

    const router = await methods.make.handler(repl, 'router')
    assert.deepEqual(router, await app.container.make('router'))

    const exportedMods = await methods.importAll.handler(repl, '../../../factories')
    assert.properties(exportedMods, [
      'core',
      'app',
      'bodyparser',
      'encryption',
      'events',
      'hash',
      'logger',
      'http',
    ])
  })
})
