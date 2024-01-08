/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Codemods } from '../../modules/ace/codemods.js'
import { AceFactory } from '../../factories/core/ace.js'

test.group('Codemods | environment variables', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('define env variables', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    /**
     * Creating .env file so that we can update it.
     */
    await fs.create('.env', '')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.defineEnvVariables({ CORS_MODE: 'strict', CORS_ENABLED: true })
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update .env file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('.env', 'CORS_MODE=strict')
    await assert.fileContains('.env', 'CORS_ENABLED=true')
  })

  test('do not define env variables when file does not exists', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const codemods = new Codemods(ace.app, ace.ui.logger)

    await codemods.defineEnvVariables({ CORS_MODE: 'strict', CORS_ENABLED: true })
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update .env file',
        stream: 'stdout',
      },
    ])

    await assert.fileNotExists('.env')
  })

  test('define env variables validations', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})

    /**
     * Creating .env file so that we can update it.
     */
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)

    const codemods = new Codemods(ace.app, ace.ui.logger)

    await codemods.defineEnvValidations({
      variables: {
        CORS_MODE: 'Env.schema.string()',
      },
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update start/env.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('start/env.ts', 'CORS_MODE: Env.schema.string()')
  })
})

test.group('Codemods | rcFile', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('update rcfile', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', 'export default defineConfig({})')

    const codemods = new Codemods(ace.app, ace.ui.logger)

    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core')
      rcFile.addCommand('@adonisjs/core/commands')
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', '@adonisjs/core')
    await assert.fileContains('adonisrc.ts', '@adonisjs/core/commands')
  })
})

test.group('Codemods | registerMiddleware', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('register middleware', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('start/kernel.ts', 'router.use([])')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.registerMiddleware('router', [{ path: '@adonisjs/core/bodyparser_middleware' }])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update start/kernel.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('start/kernel.ts', '@adonisjs/core/bodyparser_middleware')
  })
})

test.group('Codemods | registerPolicies', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('register bouncer policies', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('app/policies/main.ts', 'export const policies = {}')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.registerPolicies([{ name: 'PostPolicy', path: '#policies/post_policy' }])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update app/policies/main.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('app/policies/main.ts', '#policies/post_policy')
  })
})

test.group('Codemods | install packages', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('install packages', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()

    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', {})
    await fs.create('app/policies/main.ts', 'export const policies = {}')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.installPackages([{ name: '@adonisjs/assembler@next', isDevDependency: true }])

    await assert.dirExists('node_modules/@adonisjs/assembler')
  })

  test('install packages in verbose mode', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()

    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', {})
    await fs.create('app/policies/main.ts', 'export const policies = {}')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    codemods.verboseInstallOutput = true
    await codemods.installPackages([{ name: '@adonisjs/assembler@next', isDevDependency: true }])

    await assert.dirExists('node_modules/@adonisjs/assembler')
  })
})
