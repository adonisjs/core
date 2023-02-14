/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '../../test_factories/ace.js'
import { StubsFactory } from '../../test_factories/stubs.js'
import MakeMiddleware from '../../commands/make/middleware.js'

test.group('Make middleware', () => {
  test('create middleware class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeMiddleware, ['auth'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/middleware/main.stub', {
      entity: ace.app.generators.createEntity('auth'),
    })

    await assert.fileEquals('app/middleware/auth_middleware.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/middleware/auth_middleware.ts',
        stream: 'stdout',
      },
    ])
  })
})
