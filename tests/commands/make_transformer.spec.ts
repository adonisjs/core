/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '../../factories/core/ace.ts'
import { StubsFactory } from '../../factories/stubs.ts'
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
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/transformers/user_transformer.ts',
        stream: 'stdout',
      },
    ])
  })
})
