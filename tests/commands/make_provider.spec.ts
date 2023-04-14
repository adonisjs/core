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
import MakeProvider from '../../commands/make/provider.js'
import { StubsFactory } from '../../factories/stubs.js'

test.group('Make provider', () => {
  test('create provider class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/provider/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })

    await assert.fileEquals('providers/app_provider.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create providers/app_provider.ts',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('.adonisrc.json', /"\.\/providers\/app_provider\.js"/)
  })
})
