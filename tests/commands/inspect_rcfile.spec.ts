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
import InspectRCFile from '../../commands/inspect_rcfile.js'

test.group('Inspect RCFile', () => {
  test('inspect rcfile contents', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const inspect = await ace.create(InspectRCFile, [])
    await inspect.exec()

    inspect.assertSucceeded()

    const { raw, providers, preloads, commands, ...rcContents } = ace.app.rcFile
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: JSON.stringify(
          {
            ...rcContents,
            providers: providers.map((provider) => {
              return {
                ...provider,
                file: provider.file.toString(),
              }
            }),
            preloads: preloads.map((preload) => {
              return {
                ...preload,
                file: preload.file.toString(),
              }
            }),
            commands: commands.map((command) => {
              return command.toString()
            }),
          },
          null,
          2
        ),
        stream: 'stdout',
      },
    ])
  })
})
