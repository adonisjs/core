/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import GenerateKey from '../../commands/generate_key.js'
import { AceFactory } from '../../factories/core/ace.js'

test.group('Generate key', () => {
  test('create key and write it to .env file', async ({ assert, fs }) => {
    await fs.create('.env', '')
    await fs.create('.env.example', '')

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GenerateKey, [])
    await command.exec()

    await assert.fileContains('.env', 'APP_KEY=')
    await assert.fileContains('.env.example', 'APP_KEY=')
  })

  test('do not write to the file when --show flag is set', async ({ assert, fs }) => {
    await fs.create('.env', '')
    await fs.create('.env.example', '')

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GenerateKey, ['--show'])
    await command.exec()

    await assert.fileEquals('.env', '')
    await assert.fileEquals('.env.example', '')

    assert.deepEqual(ace.ui.logger.getLogs()[0].stream, 'stdout')
    assert.match(ace.ui.logger.getLogs()[0].message, /APP_KEY =/)
  })

  test('do not write to the file when in production envionment', async ({
    assert,
    fs,
    cleanup,
  }) => {
    await fs.create('.env', '')
    await fs.create('.env.example', '')

    cleanup(() => {
      delete process.env.NODE_ENV
    })

    process.env.NODE_ENV = 'production'

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GenerateKey, [])
    await command.exec()

    await assert.fileEquals('.env', '')
    await assert.fileEquals('.env.example', '')

    assert.deepEqual(ace.ui.logger.getLogs()[0].stream, 'stdout')
    assert.match(ace.ui.logger.getLogs()[0].message, /APP_KEY =/)
  })

  test('write to the file when in production envionment and --force flag is set', async ({
    assert,
    fs,
    cleanup,
  }) => {
    await fs.create('.env', '')
    await fs.create('.env.example', '')

    cleanup(() => {
      delete process.env.NODE_ENV
    })

    process.env.NODE_ENV = 'production'

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GenerateKey, ['--force'])
    await command.exec()

    await assert.fileContains('.env', 'APP_KEY=')
    await assert.fileContains('.env.example', 'APP_KEY=')
  })
})
