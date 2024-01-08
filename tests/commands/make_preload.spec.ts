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
import MakePreload from '../../commands/make/preload.js'

test.group('Make preload file', () => {
  test('create a preload file for all environments', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreload, ['app'])
    command.prompt.trap('Do you want to register the preload file in .adonisrc.ts file?').accept()
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/preload/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })
    await assert.fileEquals('start/app.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create start/app.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', `() => import('#start/app')`)
  })

  test('do not prompt when --register flag is used', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreload, ['app', '--register'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/preload/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })
    await assert.fileEquals('start/app.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create start/app.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', `() => import('#start/app')`)
  })

  test('do not register preload file when --no-register flag is used', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreload, ['app', '--no-register'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/preload/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })
    await assert.fileEquals('start/app.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create start/app.ts',
        stream: 'stdout',
      },
    ])

    await assert.fileEquals('adonisrc.ts', `export default defineConfig({})`)
  })

  test('use environment flag to make preload file in a specific env', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreload, [
      'app',
      '--environments=web',
      '--environments=repl',
    ])
    command.prompt.trap('Do you want to register the preload file in .adonisrc.ts file?').accept()
    await command.exec()

    await assert.fileContains('adonisrc.ts', [
      `() => import('#start/app')`,
      `environment: ['web', 'repl']`,
    ])
  })

  test('display error when defined environment is not allowed', async ({ fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakePreload, ['app'])
    command.environments = ['foo' as any]
    command.prompt.trap('Do you want to register the preload file in .adonisrc.ts file?').accept()
    await command.exec()

    command.assertLog(
      '[ red(error) ] Invalid environment(s) "foo". Only "web,console,test,repl" are allowed'
    )
  })
})
