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

  test('overwrite file contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('my-transformer.txt', 'export class MyTransformer {}')

    const command = await ace.create(MakeTransformer, [
      'user',
      '--contents-from',
      join(fs.basePath, 'my-transformer.txt'),
    ])
    await command.exec()

    await assert.fileEquals('app/transformers/user_transformer.ts', `export class MyTransformer {}`)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/transformers/user_transformer.ts',
        stream: 'stdout',
      },
    ])
  })
})
