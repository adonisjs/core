/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import EnvAdd from '../../commands/env/add.js'
import { AceFactory } from '../../factories/core/ace.js'

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
