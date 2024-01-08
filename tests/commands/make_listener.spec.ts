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
import { AceFactory } from '../../factories/core/ace.js'
import { StubsFactory } from '../../factories/stubs.js'
import MakeEventCommand from '../../commands/make/event.js'
import MakeListenerCommand from '../../commands/make/listener.js'

test.group('Make listener', () => {
  test('create listener class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeListenerCommand, ['sendEmail'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/listener/main.stub', {
      entity: ace.app.generators.createEntity('sendEmail'),
    })

    await assert.fileEquals('app/listeners/send_email.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/listeners/send_email.ts',
        stream: 'stdout',
      },
    ])
  })

  test('create a listener with an event class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)

    ace.addLoader(new ListLoader([MakeEventCommand]))
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeListenerCommand, ['sendEmail', '-e=orderShipped'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/listener/for_event.stub', {
      entity: ace.app.generators.createEntity('sendEmail'),
      event: ace.app.generators.createEntity('orderShipped'),
    })

    const { contents: eventContents } = await new StubsFactory().prepare('make/event/main.stub', {
      entity: ace.app.generators.createEntity('orderShipped'),
    })

    await assert.fileEquals('app/listeners/send_email.ts', contents)
    await assert.fileEquals('app/events/order_shipped.ts', eventContents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/events/order_shipped.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    create app/listeners/send_email.ts',
        stream: 'stdout',
      },
    ])
  })
})
