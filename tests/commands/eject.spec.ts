/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import EjectCommand from '../../commands/eject.js'
import { AceFactory } from '../../factories/core/ace.js'

test.group('Eject', () => {
  test('eject a single stub', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EjectCommand, [
      'make/controller/main.stub',
      '--pkg="../../index.js"',
    ])
    await command.exec()

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: '[ green(success) ] eject stubs/make/controller/main.stub',
        stream: 'stdout',
      },
    ])

    await assert.hasFiles(['stubs/make/controller/main.stub'])
  })

  test('eject a directory', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EjectCommand, ['make/controller', '--pkg="../../index.js"'])
    await command.exec()

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: '[ green(success) ] eject stubs/make/controller/actions.stub',
        stream: 'stdout',
      },
      {
        message: '[ green(success) ] eject stubs/make/controller/api.stub',
        stream: 'stdout',
      },
      {
        message: '[ green(success) ] eject stubs/make/controller/main.stub',
        stream: 'stdout',
      },
      {
        message: '[ green(success) ] eject stubs/make/controller/resource.stub',
        stream: 'stdout',
      },
    ])

    await assert.hasFiles([
      'stubs/make/controller/main.stub',
      'stubs/make/controller/api.stub',
      'stubs/make/controller/resource.stub',
    ])
  })
})
