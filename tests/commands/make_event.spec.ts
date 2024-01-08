/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '../../factories/core/ace.js'
import { StubsFactory } from '../../factories/stubs.js'
import MakeEventCommand from '../../commands/make/event.js'

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
})
