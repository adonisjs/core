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
import MakeService from '../../commands/make/service.js'

test.group('Make service', () => {
  test('create service class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeService, ['app'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/service/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })

    await assert.fileEquals('app/services/app_service.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/services/app_service.ts',
        stream: 'stdout',
      },
    ])
  })
})
