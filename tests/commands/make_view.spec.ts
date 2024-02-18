/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import MakeView from '../../commands/make/view.js'
import { StubsFactory } from '../../factories/stubs.js'
import { AceFactory } from '../../factories/core/ace.js'

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
})
