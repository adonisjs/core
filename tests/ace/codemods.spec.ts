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

test.group('Configure command | environment variables', () => {
  test('define env variables', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
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
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
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
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
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

test.group('Configure command | rcFile', () => {
  test('update rcfile', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
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

test.group('Configure command | registerMiddleware', () => {
  test('register middleware', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
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
