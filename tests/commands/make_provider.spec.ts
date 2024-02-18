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
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app'])
    command.prompt.trap('Do you want to register the provider in .adonisrc.ts file?').accept()
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
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', `() => import('#providers/app_provider')`)
  })

  test('do not display prompt when --register flag is used', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app', '--register'])
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
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', `() => import('#providers/app_provider')`)
  })

  test('do not register provider when --no-register flag is used', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app', '--no-register'])
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

    await assert.fileEquals('adonisrc.ts', `export default defineConfig({})`)
  })

  test('create provider class for a specific environment', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app', '-e=web', '-e=repl'])
    command.prompt.trap('Do you want to register the provider in .adonisrc.ts file?').accept()
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/provider/main.stub', {
      entity: ace.app.generators.createEntity('app'),
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create providers/app_provider.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileEquals('providers/app_provider.ts', contents)
    await assert.fileContains('adonisrc.ts', [
      `() => import('#providers/app_provider')`,
      `environment: ['web', 'repl']`,
    ])
  })

  test('show error when selected environment is invalid', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeProvider, ['app', '--environments=foo'])
    command.prompt.trap('Do you want to register the provider in .adonisrc.ts file?').accept()
    await command.exec()

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ red(error) ] Invalid environment(s) "foo". Only "web,console,test,repl" are allowed',
        stream: 'stderr',
      },
    ])
  })
})
