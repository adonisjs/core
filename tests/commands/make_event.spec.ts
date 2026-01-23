/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { AceFactory } from '../../factories/core/ace.ts'
import { StubsFactory } from '../../factories/stubs.ts'
import MakeEventCommand from '../../commands/make/event.ts'

test.group('Make event', () => {
  test('create event class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeEventCommand, ['orderShipped'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/event/main.stub', {
      entity: ace.app.generators.createEntity('orderShipped'),
    })

    await assert.fileEquals('app/events/order_shipped.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/events/order_shipped.ts',
        stream: 'stdout',
      },
    ])
  })

  test('overwrite file contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('my-event.txt', 'export class MyEvent {}')

    const command = await ace.create(MakeEventCommand, [
      'orderShipped',
      '--contents-from',
      join(fs.basePath, 'my-event.txt'),
    ])
    await command.exec()

    await assert.fileEquals('app/events/order_shipped.ts', `export class MyEvent {}`)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/events/order_shipped.ts',
        stream: 'stdout',
      },
    ])
  })
})
