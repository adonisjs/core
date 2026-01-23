/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import MakeCommand from '../../commands/make/command.ts'
import { AceFactory } from '../../factories/core/ace.ts'
import { StubsFactory } from '../../factories/stubs.ts'
import { join } from 'node:path'

test.group('Make command', () => {
  test('create command class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeCommand, ['listRoutes'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/command/main.stub', {
      entity: ace.app.generators.createEntity('listRoutes'),
    })

    await assert.fileEquals('commands/list_routes.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create commands/list_routes.ts',
        stream: 'stdout',
      },
    ])
  })

  test('overwrite file contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('my-command.txt', 'export class MyCommand {}')

    const command = await ace.create(MakeCommand, [
      'listRoutes',
      '--contents-from',
      join(fs.basePath, 'my-command.txt'),
    ])
    await command.exec()

    await assert.fileEquals('commands/list_routes.ts', `export class MyCommand {}`)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create commands/list_routes.ts',
        stream: 'stdout',
      },
    ])
  })
})
