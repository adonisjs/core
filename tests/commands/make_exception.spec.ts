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
import MakeException from '../../commands/make/exception.ts'

test.group('Make exception command', () => {
  test('create exception class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeException, ['Unauthorized'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/exception/main.stub', {
      entity: ace.app.generators.createEntity('Unauthorized'),
    })

    await assert.fileEquals('app/exceptions/unauthorized_exception.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/exceptions/unauthorized_exception.ts',
        stream: 'stdout',
      },
    ])
  })

  test('overwrite file contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('my-exception.txt', 'export class MyException {}')

    const command = await ace.create(MakeException, [
      'Unauthorized',
      '--contents-from',
      join(fs.basePath, 'my-exception.txt'),
    ])
    await command.exec()

    await assert.fileEquals(
      'app/exceptions/unauthorized_exception.ts',
      `export class MyException {}`
    )
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/exceptions/unauthorized_exception.ts',
        stream: 'stdout',
      },
    ])
  })
})
