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
import supertest from 'supertest'
import { createServer } from 'http'
import { stdout } from 'test-console'

import { Ignitor } from '../src/Ignitor'
import { TestUtils } from '../src/TestUtils'
import { setupApplicationFiles, fs } from '../test-helpers'

test.group('Test utils', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('start http server using test utils', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = true
      export const exposeHeaders = []
    `
    )

    const kernel = new Ignitor(fs.basePath).kernel('test')
    await kernel.boot()

    const server = kernel.application.container.use('Adonis/Core/Server')
    kernel.application.container.use('Adonis/Core/Route').get('/', async () => 'handled')

    const testUtils = new TestUtils(kernel.application)
    const cleanup = await testUtils.httpServer().start((handler) => createServer(handler))

    const { text } = await supertest(server.instance).get('/').expect(200)
    await cleanup()

    assert.equal(text, 'handled')
  })

  test('load ace commands using test utils', async ({ assert }) => {
    await setupApplicationFiles()

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add(
      '.adonisrc.json',
      JSON.stringify({
        typescript: false,
        commands: ['./FooCommand'],
        providers: [join(__dirname, '../providers/AppProvider.ts')],
      })
    )

    await fs.add(
      'FooCommand.ts',
      `
      const { BaseCommand } = require('@adonisjs/ace')
      export default class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        static get settings () {
          return {
            loadApp: true,
            stayAlive: true
          }
        }

        run () {
          console.log(\`is ready \${this.application.isReady}\`)
        }
      }
    `
    )

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])

    const kernel = ignitor.kernel('test')
    await kernel.boot()

    const testUtils = new TestUtils(kernel.application)
    const ace = kernel.application.container.resolveBinding('Adonis/Core/Ace')
    assert.isNull(await ace.find(['foo']))

    await testUtils.ace().loadCommands()
    assert.isNotNull(await ace.find(['foo']))

    const { output, restore } = stdout.inspect()
    await ignitor.ace().handle(['foo'])
    restore()

    assert.equal(output[0].trim(), 'is ready true')
  })

  test('add macros to test utils class', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = true
      export const exposeHeaders = []
    `
    )

    const kernel = new Ignitor(fs.basePath).kernel('test')
    await kernel.boot()

    const testUtils = kernel.application.container.resolveBinding('Adonis/Core/TestUtils')
    testUtils.constructor.macro('foo', () => 'bar')

    assert.equal(testUtils['foo'](), 'bar')
  })

  test('add getters to test utils class', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = true
      export const exposeHeaders = []
    `
    )

    const kernel = new Ignitor(fs.basePath).kernel('test')
    await kernel.boot()

    const testUtils = kernel.application.container.resolveBinding('Adonis/Core/TestUtils')
    testUtils.constructor.macro('foo', () => 'bar')
    testUtils.constructor.getter('bar', function () {
      return this['foo']()
    })

    assert.equal(testUtils['bar'], 'bar')
  })
})
