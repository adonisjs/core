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

import MakeView from '../../commands/make/view.ts'
import { StubsFactory } from '../../factories/stubs.ts'
import { AceFactory } from '../../factories/core/ace.ts'

test.group('Make view', () => {
  test('create view template', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeView, ['welcome'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/view/main.stub', {
      entity: ace.app.generators.createEntity('welcome'),
    })

    await assert.fileEquals('resources/views/welcome.edge', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create resources/views/welcome.edge',
        stream: 'stdout',
      },
    ])
  })

  test('overwrite file contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('my-view.txt', '<h1>My View</h1>')

    const command = await ace.create(MakeView, [
      'welcome',
      '--contents-from',
      join(fs.basePath, 'my-view.txt'),
    ])
    await command.exec()

    await assert.fileEquals('resources/views/welcome.edge', `<h1>My View</h1>`)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create resources/views/welcome.edge',
        stream: 'stdout',
      },
    ])
  })
})
