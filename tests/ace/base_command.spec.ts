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
import { BaseCommand } from '../../modules/ace/main.js'
import { ListCommand } from '../../modules/ace/commands.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'
import { createAceKernel } from '../../modules/ace/create_kernel.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Base command', () => {
  test('infer staysAlive and startApp flags from command options', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static options = {
        startApp: true,
        staysAlive: true,
      }
    }

    const kernel = createAceKernel(app)
    const command = await kernel.create(MakeController, [])
    const listCommand = await kernel.create(ListCommand, [])

    assert.isTrue(command.startApp)
    assert.isTrue(command.staysAlive)

    assert.isUndefined(listCommand.startApp)
    assert.isUndefined(listCommand.staysAlive)
  })

  test('execute command template methods', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'

      stack: string[] = []
      async prepare() {
        this.stack.push('prepare')
      }

      async interact() {
        this.stack.push('interact')
      }

      async run() {
        this.stack.push('run')
      }

      async completed() {
        this.stack.push('completed')
      }
    }

    const kernel = createAceKernel(app)
    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.deepEqual(command.stack, ['prepare', 'interact', 'run', 'completed'])
  })

  test('do not run template methods when do not exists', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      stack: string[] = []

      async run() {
        this.stack.push('run')
      }
    }

    const kernel = createAceKernel(app)
    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.deepEqual(command.stack, ['run'])
  })

  test('fail when prepare method raises exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async prepare() {
        throw new Error('prepare failed')
      }
    }

    const kernel = createAceKernel(app)
    kernel.ui.switchMode('raw')

    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.equal(command.error.message, 'prepare failed')
    assert.equal(command.exitCode, 1)
    assert.lengthOf(command.logger.getLogs(), 1)
    assert.equal(command.logger.getLogs()[0].stream, 'stderr')
  })

  test('fail when interact method raises exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async interact() {
        throw new Error('interact failed')
      }
    }

    const kernel = createAceKernel(app)
    kernel.ui.switchMode('raw')

    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.equal(command.error.message, 'interact failed')
    assert.equal(command.exitCode, 1)
    assert.lengthOf(command.logger.getLogs(), 1)
    assert.equal(command.logger.getLogs()[0].stream, 'stderr')
  })

  test('fail when run method raises exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async run() {
        throw new Error('run failed')
      }
    }

    const kernel = createAceKernel(app)
    kernel.ui.switchMode('raw')

    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.equal(command.error.message, 'run failed')
    assert.equal(command.exitCode, 1)
    assert.lengthOf(command.logger.getLogs(), 1)
    assert.equal(command.logger.getLogs()[0].stream, 'stderr')
  })

  test('do not print errors when completed method handles exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async run() {
        throw new Error('run failed')
      }

      async completed() {
        return true
      }
    }

    const kernel = createAceKernel(app)
    kernel.ui.switchMode('raw')

    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.equal(command.error.message, 'run failed')
    assert.equal(command.exitCode, 1)
    assert.lengthOf(command.logger.getLogs(), 0)
  })

  test('print error when completed method does not handles exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async run() {
        throw new Error('run failed')
      }

      async completed() {
        return false
      }
    }

    const kernel = createAceKernel(app)
    kernel.ui.switchMode('raw')

    const command = await kernel.create(MakeController, [])
    await command.exec()

    assert.equal(command.error.message, 'run failed')
    assert.equal(command.exitCode, 1)
    assert.lengthOf(command.logger.getLogs(), 1)
    assert.equal(command.logger.getLogs()[0].stream, 'stderr')
  })

  test('throw exception when completed method raises exception', async ({ assert }) => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static commandName: string = 'make:controller'
      async completed() {
        throw new Error('completed failed')
      }
    }

    const kernel = createAceKernel(app)
    const command = await kernel.create(MakeController, [])

    await assert.rejects(() => command.exec(), 'completed failed')
  })

  test('call app terminate when main command terminate method is called', async () => {
    const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL)

    const app = ignitor.createApp('console')
    await app.init()

    class MakeController extends BaseCommand {
      static options = {
        startApp: true,
        staysAlive: true,
      }
    }

    const kernel = createAceKernel(app)
    const command = await kernel.create(MakeController, [])
    const listCommand = await kernel.create(ListCommand, [])

    const appMock = sinon.mock(app)
    appMock.expects('terminate').twice()

    kernel.getMainCommand = () => command
    await command.terminate()

    kernel.getMainCommand = () => listCommand
    await listCommand.terminate()

    appMock.verify()
  })
})
