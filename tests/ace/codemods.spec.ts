/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Codemods } from '../../modules/ace/codemods.ts'
import { AceFactory } from '../../factories/core/ace.ts'

test.group('Codemods', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('get ts morph project', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()

    const codemods = new Codemods(ace.app, ace.ui.logger)
    const project = await codemods.getTsMorphProject()

    assert.exists(project)
  })

  test('reuse the same CodeTransformer instance', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {})

    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()

    const codemods = new Codemods(ace.app, ace.ui.logger)
    const project1 = await codemods.getTsMorphProject()
    const project2 = await codemods.getTsMorphProject()

    assert.deepEqual(project1, project2)
  })
})

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

  test('do not insert env value in .env.example if specified', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    /**
     * Creating .env file so that we can update it.
     */
    await fs.create('.env', '')
    await fs.create('.env.example', '')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.defineEnvVariables(
      { SECRET_VALUE: 'secret' },
      { omitFromExample: ['SECRET_VALUE'] }
    )
    await assert.fileContains('.env', 'SECRET_VALUE=secret')
    await assert.fileContains('.env.example', 'SECRET_VALUE=')
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

test.group('Codemods | registerVitePlugin', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('register vite plugin', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', {})
    await fs.create('vite.config.ts', 'export default { plugins: [] }')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.registerVitePlugin('vue()', [
      { identifier: 'vue', module: '@vitejs/plugin-vue', isNamed: false },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update vite.config.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('vite.config.ts', 'vue()')
  })
})

test.group('Codemods | registerJapaPlugin', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('register japa plugin', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', {})
    await fs.create('tests/bootstrap.ts', 'export const plugins = []')

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.registerJapaPlugin('apiClient()', [
      { identifier: 'apiClient', module: '@japa/api-client', isNamed: true },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update tests/bootstrap.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('tests/bootstrap.ts', 'apiClient()')
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
    await codemods.installPackages([{ name: '@adonisjs/assembler', isDevDependency: true }])

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
    await codemods.installPackages([{ name: '@adonisjs/assembler', isDevDependency: true }])

    await assert.dirExists('node_modules/@adonisjs/assembler')
  })
})

test.group('Codemods | addValidator', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('add validator file', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.addValidator({
      validatorFileName: 'create_user.ts',
      exportName: 'createUserValidator',
      contents: 'export const createUserValidator = vine.compile(vine.object({}))',
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create validator file',
        stream: 'stdout',
      },
    ])

    await assert.fileExists('app/validators/create_user.ts')
    await assert.fileContains('app/validators/create_user.ts', 'createUserValidator')
  })
})

test.group('Codemods | addLimiter', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('add limiter file', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.addLimiter({
      limiterFileName: 'limiter.ts',
      exportName: 'apiThrottleLimiter',
      contents: 'export const apiThrottleLimiter = limiter.define("api", () => {})',
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create limiter file',
        stream: 'stdout',
      },
    ])

    await assert.fileExists('start/limiter.ts')
    await assert.fileContains('start/limiter.ts', 'apiThrottleLimiter')
  })
})

test.group('Codemods | addModelMixins', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('add mixins to model', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create(
      'app/models/user.ts',
      `import { BaseModel } from '@adonisjs/lucid/orm'
export default class User extends BaseModel {}`
    )

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.addModelMixins('user.ts', [
      {
        name: 'SoftDeletes',
        importPath: '@adonisjs/lucid/mixins/soft_deletes',
        importType: 'named',
      },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update model file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('app/models/user.ts', 'SoftDeletes')
    await assert.fileContains('app/models/user.ts', '@adonisjs/lucid/mixins/soft_deletes')
  })
})

test.group('Codemods | addControllerMethod', (group) => {
  group.tap((t) => t.timeout(60 * 1000))

  test('add method to controller', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create(
      'app/controllers/users_controller.ts',
      `export default class UsersController {
  async index() {}
}`
    )

    const codemods = new Codemods(ace.app, ace.ui.logger)
    await codemods.addControllerMethod({
      controllerFileName: 'users_controller.ts',
      className: 'UsersController',
      name: 'destroy',
      contents: 'async destroy({ params }: HttpContext) { return params.id }',
      imports: [
        {
          source: '@adonisjs/core/http',
          typeImports: ['HttpContext'],
        },
      ],
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update controller file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('app/controllers/users_controller.ts', 'destroy')
    await assert.fileContains('app/controllers/users_controller.ts', 'HttpContext')
  })
})
