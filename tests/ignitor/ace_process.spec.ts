/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { ListLoader } from '../../modules/ace/main.js'
import type { CommandOptions } from '../../types/ace.js'
import { BaseCommand } from '../../modules/ace/commands.js'
import { IgnitorFactory } from '../../test_factories/ignitor.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Ignitor | Ace process', () => {
  test('run command', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    let greetCommandExecuted = false
    class Greet extends BaseCommand {
      static commandName: string = 'greet'
      async run() {
        greetCommandExecuted = true
      }
    }

    await ignitor
      .ace()
      .configure(async (app) => {
        const kernel = await app.container.make('ace')
        kernel.addLoader(new ListLoader([Greet]))
      })
      .handle(['greet'])

    assert.isTrue(greetCommandExecuted)
    assert.equal(process.exitCode, 0)
    assert.equal(ignitor.getApp()?.getEnvironment(), 'console')
    assert.equal(ignitor.getApp()?.getState(), 'initiated')
  })

  test('start app when command needs app', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    let greetCommandExecuted = false
    class Greet extends BaseCommand {
      static commandName: string = 'greet'
      static options: CommandOptions = {
        startApp: true,
      }

      async run() {
        greetCommandExecuted = true
        assert.equal(this.app.getState(), 'ready')
      }
    }

    await ignitor
      .ace()
      .configure(async (app) => {
        const kernel = await app.container.make('ace')
        kernel.addLoader(new ListLoader([Greet]))
      })
      .handle(['greet'])

    assert.isTrue(greetCommandExecuted)
    assert.equal(process.exitCode, 0)
    assert.equal(ignitor.getApp()?.getState(), 'terminated')
  })

  test('exit with status = 1 when command raises an exception', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    class Greet extends BaseCommand {
      static commandName: string = 'greet'
      async run() {
        throw new Error('failed')
      }
    }

    await ignitor
      .ace()
      .configure(async (app) => {
        const kernel = await app.container.make('ace')
        kernel.addLoader(new ListLoader([Greet]))
      })
      .handle(['greet'])

    assert.equal(process.exitCode, 1)
  })

  test('exit with status = 1 when command exitCode = 1', async ({ cleanup, assert }) => {
    cleanup(async () => {
      await ignitor.terminate()
    })

    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../../providers/app_provider.js',
            '../../providers/hash_provider.js',
            '../../providers/http_provider.js',
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    class Greet extends BaseCommand {
      static commandName: string = 'greet'
      async run() {
        this.exitCode = 1
      }
    }

    await ignitor
      .ace()
      .configure(async (app) => {
        const kernel = await app.container.make('ace')
        kernel.addLoader(new ListLoader([Greet]))
      })
      .handle(['greet'])

    assert.equal(process.exitCode, 1)
  })
})
