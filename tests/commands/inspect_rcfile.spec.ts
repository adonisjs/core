/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import lodash from '@poppinss/utils/lodash'
import { AceFactory } from '../../factories/core/ace.js'
import InspectRCFile from '../../commands/inspect_rcfile.js'

test.group('Inspect RCFile', () => {
  test('inspect rcfile contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(InspectRCFile, [])
    await command.exec()

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: JSON.stringify(lodash.omit(ace.app.rcFile, ['raw']), null, 2),
        stream: 'stdout',
      },
    ])
  })
})
