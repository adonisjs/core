/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { StubsFactory } from '../../factories/stubs.js'
import { AceFactory } from '../../factories/core/ace.js'
import MakePreloadFile from '../../commands/make/preload_file.js'

test.group('Make preload file', () => {
  test('create preload file', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreloadFile, ['app', '--environments=web'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/preload_file/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })
    await assert.fileEquals('start/app.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create start/app.ts',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('.adonisrc.json', /"\.\/start\/app\.js"/)
  })

  test('create preload file for specific environments', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreloadFile, ['app'])
    command.prompt
      .trap('Select the environment(s) in which you want to load this file')
      .replyWith(['web', 'repl'])

    await command.exec()

    const rcFile = await fs.contentsJson('.adonisrc.json')

    assert.deepEqual(rcFile.preloads, [{ file: './start/app.js', environment: ['web', 'repl'] }])
  })

  test('create preload file for all environments', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreloadFile, ['app'])
    command.prompt
      .trap('Select the environment(s) in which you want to load this file')
      .replyWith(['all'])

    await command.exec()

    const rcFile = await fs.contentsJson('.adonisrc.json')

    assert.deepEqual(rcFile.preloads, ['./start/app.js'])
  })
})
