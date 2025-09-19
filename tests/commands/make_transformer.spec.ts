/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { ListLoader } from '../../modules/ace/main.ts'
import { AceFactory } from '../../factories/core/ace.ts'
import { StubsFactory } from '../../factories/stubs.ts'
import MakeEventCommand from '../../commands/make/event.ts'
import MakeListenerCommand from '../../commands/make/listener.ts'
import MakeTransformer from '../../commands/make/transformer.ts'

test.group('Make transformer', () => {
  test('create transformer class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTransformer, ['user'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/transformer/main.stub', {
      entity: ace.app.generators.createEntity('user'),
      model: ace.app.generators.createEntity('user'),
    })

    await assert.fileEquals('app/transformers/user_transformer.ts', contents)
    console.log(contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/transformers/user_transformer.ts',
        stream: 'stdout',
      },
    ])
  })
})
