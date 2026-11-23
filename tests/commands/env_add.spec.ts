/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import EnvAdd from '../../commands/env/add.ts'
import { AceFactory } from '../../factories/core/ace.ts'

test.group('Env Add command', () => {
  test('add new env variable to the different files', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, ['variable', 'value', '--type=string'])
    await command.exec()

    await assert.fileContains('.env', 'VARIABLE=value')
    await assert.fileContains('.env.example', 'VARIABLE=')
    await assert.fileContains('./start/env.ts', 'VARIABLE: Env.schema.string()')
  })

  test('add secret env variable using the type flag', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, ['api_key', 'my_secret', '--type=secret'])
    await command.exec()

    await assert.fileContains('.env', 'API_KEY=my_secret')
    await assert.fileContains('.env.example', 'API_KEY=')
    await assert.fileNotContains('.env.example', 'my_secret')
    await assert.fileContains('./start/env.ts', 'API_KEY: Env.schema.secret()')
  })

  test('select secret type from the prompt', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, ['api_key', 'my_secret'])
    command.prompt.trap('Select the variable type').replyWith('secret')
    await command.exec()

    await assert.fileContains('.env', 'API_KEY=my_secret')
    await assert.fileContains('.env.example', 'API_KEY=')
    await assert.fileNotContains('.env.example', 'my_secret')
    await assert.fileContains('./start/env.ts', 'API_KEY: Env.schema.secret()')
  })

  test('convert variable to screaming snake case', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, ['stripe_ApiKey', 'value', '--type=string'])
    await command.exec()

    await assert.fileContains('.env', 'STRIPE_API_KEY=value')
    await assert.fileContains('.env.example', 'STRIPE_API_KEY=')
    await assert.fileContains('./start/env.ts', 'STRIPE_API_KEY: Env.schema.string()')
  })

  test('add number and boolean env variables using the type flag', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const portCommand = await ace.create(EnvAdd, ['port', '3333', '--type=number'])
    await portCommand.exec()
    portCommand.assertSucceeded()

    const debugCommand = await ace.create(EnvAdd, ['debug', 'true', '--type=boolean'])
    await debugCommand.exec()
    debugCommand.assertSucceeded()

    await assert.fileContains('.env', 'PORT=3333')
    await assert.fileContains('.env', 'DEBUG=true')
    await assert.fileContains('./start/env.ts', 'PORT: Env.schema.number()')
    await assert.fileContains('./start/env.ts', 'DEBUG: Env.schema.boolean()')
  })

  test('enum type with allowed values', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, [
      'variable',
      'bar',
      '--type=enum',
      '--enum-values=foo',
      '--enum-values=bar',
    ])
    await command.exec()

    await assert.fileContains('.env', 'VARIABLE=bar')
    await assert.fileContains('.env.example', 'VARIABLE=')
    await assert.fileContains(
      './start/env.ts',
      "VARIABLE: Env.schema.enum(['foo', 'bar'] as const)"
    )
  })

  test('prompt for enum values when the enum-values flag is missing', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, ['log_level', 'info', '--type=enum'])
    command.prompt.trap('Enter the enum values separated by a comma').replyWith('debug, info ,warn')
    await command.exec()

    command.assertSucceeded()
    await assert.fileContains('.env', 'LOG_LEVEL=info')
    await assert.fileContains('.env.example', 'LOG_LEVEL=')
    await assert.fileContains(
      './start/env.ts',
      "LOG_LEVEL: Env.schema.enum(['debug', 'info', 'warn'] as const)"
    )
  })

  test('do not prompt for enum values when the enum-values flag is repeated', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, [
      'log_level',
      'info',
      '--type=enum',
      '--enum-values=debug',
      '--enum-values=info',
      '--enum-values=warn',
    ])
    command.prompt.trap('Enter the enum values separated by a comma').replyWith('error')
    await command.exec()

    command.assertSucceeded()
    assert.isTrue(command.prompt.traps.prompts.has('Enter the enum values separated by a comma'))
    await assert.fileContains(
      './start/env.ts',
      "LOG_LEVEL: Env.schema.enum(['debug', 'info', 'warn'] as const)"
    )
  })

  test('prompt when nothing is passed to the command', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})
    await fs.create('.env', '')
    await fs.create('.env.example', '')
    await fs.create(
      './start/env.ts',
      `import { Env } from '@adonisjs/core/env'
      export default await Env.create(new URL('../', import.meta.url), {})`
    )

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(EnvAdd, [])

    command.prompt.trap('Enter the variable name').replyWith('my_variable_name')
    command.prompt.trap('Enter the variable value').replyWith('my_value')
    command.prompt.trap('Select the variable type').replyWith('string')

    await command.exec()

    await assert.fileContains('.env', 'MY_VARIABLE_NAME=my_value')
    await assert.fileContains('.env.example', 'MY_VARIABLE_NAME=')
    await assert.fileContains('./start/env.ts', 'MY_VARIABLE_NAME: Env.schema.string()')
  })
})
