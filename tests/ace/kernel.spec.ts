/*
 * @adonisjs/ace
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import sinon from 'sinon'
import { test } from '@japa/runner'
import { HelpCommand } from '../../modules/ace/main.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'
import { createAceKernel } from '../../modules/ace/create_kernel.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Kernel', () => {
  test('create kernel instance with global flags', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    assert.deepEqual(kernel.flags, [
      {
        name: 'ansi',
        flagName: 'ansi',
        required: false,
        type: 'boolean',
        showNegatedVariantInHelp: true,
        description: 'Force enable or disable colorful output',
      },
      {
        name: 'help',
        flagName: 'help',
        required: false,
        type: 'boolean',
        description: 'View help for a given command',
      },
    ])
  })

  test('turn off colors when --no-ansi flag is mentioned', async () => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    const switchMode = sinon.spy(kernel.ui.switchMode)

    await kernel.handle(['--no-ansi'])
    switchMode.calledWith('silent')
  })

  test('turn off colors when --no-ansi flag is mentioned', async () => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    const switchMode = sinon.spy(kernel.ui.switchMode)

    await kernel.handle(['--no-ansi'])
    switchMode.calledWith('silent')
  })

  test('turn on colors when --ansi flag is mentioned', async () => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    const switchMode = sinon.spy(kernel.ui.switchMode)

    await kernel.handle(['--ansi'])
    switchMode.calledWith('normal')
  })

  test('display command help when --help flag is mentioned', async () => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    const execMock = sinon.mock(HelpCommand.prototype)
    execMock.expects('exec')

    await kernel.handle(['--help'])
    execMock.verify()
  })

  test('load commands from a module identifier', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          commands: ['../commands'],
        },
      })
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath === '../commands') {
            return {
              async getMetaData() {
                return [
                  {
                    commandName: 'make:controller',
                    aliases: [],
                  },
                ]
              },
            }
          }
          import(filePath)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()

    const kernel = createAceKernel(app)
    await kernel.boot()
    assert.exists(kernel.getCommand('make:controller'))
  })
})
