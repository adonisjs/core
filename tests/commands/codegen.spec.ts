/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import Codegen from '../../commands/codegen.ts'
import { IgnitorFactory } from '../../factories/core/ignitor.ts'
import type { ApplicationService } from '../../src/types.ts'
import { createAceKernel } from '../../modules/ace/create_kernel.ts'
import { indexEntities } from '../../src/assembler_hooks/index_entities.ts'

const PKG_JSON = JSON.stringify({
  name: 'app',
  type: 'module',
  imports: { '#controllers/*': './app/controllers/*.js' },
})

/**
 * Creates an ace kernel for an app that has been initiated but not booted,
 * since the codegen command boots the app by itself.
 *
 * The app provider is referenced using a relative path, because the
 * "@adonisjs/core/providers/*" specifier resolves to the build output, which
 * does not exist when the tests run from the source.
 */
async function createAce(fsBaseUrl: URL, importer: (filePath: string) => Promise<any>) {
  const ignitor = new IgnitorFactory()
    .withCoreConfig()
    .merge({
      rcFileContents: {
        providers: [() => import('../../providers/app_provider.js')],
      },
    })
    .create(fsBaseUrl, { importer })

  const app = ignitor.createApp('console')
  await app.init()

  const ace = createAceKernel(app)
  ace.ui.switchMode('raw')
  return ace
}

test.group('Codegen command', () => {
  test('show error when assembler is not installed', async ({ assert, fs }) => {
    const ace = await createAce(fs.baseUrl, (filePath) => {
      if (filePath === '@adonisjs/assembler') {
        return import(new URL(filePath, fs.baseUrl).href)
      }

      return import(filePath)
    })

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "@adonisjs\/assembler/)
  })

  test('do not boot the app when assembler is missing', async ({ assert, fs }) => {
    const ace = await createAce(fs.baseUrl, (filePath) => {
      if (filePath === '@adonisjs/assembler') {
        return import(new URL(filePath, fs.baseUrl).href)
      }

      return import(filePath)
    })

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(ace.app.getState(), 'initiated')
    await assert.fileNotExists('.adonisjs/server/routes.d.ts')
  })

  test('warm up the app in the web environment', async ({ assert, fs }) => {
    await fs.create('package.json', PKG_JSON)

    const ace = await createAce(fs.baseUrl, (filePath) => import(filePath))

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(command.exitCode, 0)
    assert.equal(ace.app.getEnvironment(), 'web')
    assert.equal(ace.app.getMode(), 'warmup')
    assert.equal(ace.app.getState(), 'warmed')
    assert.isFalse(ace.app.isReady)
  })

  test('generate the route types', async ({ assert, fs }) => {
    await fs.create('package.json', PKG_JSON)

    const ace = await createAce(fs.baseUrl, (filePath) => import(filePath))

    ace.app.rcFile.providers.push({
      environment: ['web'],
      file: async () => ({
        default: class RoutesProvider {
          constructor(protected app: ApplicationService) {}

          async boot() {
            const router = await this.app.container.make('router')
            router.get('/users', () => 'ok').as('users.index')
          }
        },
      }),
    })

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(command.exitCode, 0)
    await assert.fileExists('.adonisjs/server/routes.d.ts')
    await assert.fileContains('.adonisjs/server/routes.d.ts', [
      'export type ScannedRoutes = {',
      'users.index',
    ])

    /**
     * The JSON file only exists to hand the routes over to the dev-server. The
     * command passes them in memory instead
     */
    await assert.fileNotExists('.adonisjs/server/routes.json')
  })

  test('generate the index files', async ({ assert, fs }) => {
    await fs.create('package.json', PKG_JSON)
    await fs.create('app/controllers/users_controller.ts', '')

    const ace = await createAce(fs.baseUrl, (filePath) => import(filePath))

    ace.app.rcFile.hooks = {
      init: [indexEntities({ events: { enabled: false }, listeners: { enabled: false } })],
    }

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(command.exitCode, 0)
    await assert.fileExists('.adonisjs/server/controllers.ts')
    await assert.fileContains('.adonisjs/server/controllers.ts', [
      `Users: () => import('#controllers/users_controller')`,
    ])
  })

  test('generate the index files before booting the app', async ({ assert, fs }) => {
    await fs.create('package.json', PKG_JSON)
    await fs.create('app/controllers/users_controller.ts', '')

    const ace = await createAce(fs.baseUrl, (filePath) => import(filePath))

    ace.app.rcFile.hooks = {
      init: [indexEntities({ events: { enabled: false }, listeners: { enabled: false } })],
    }

    /**
     * A real application imports the generated barrel files from its preload
     * files. The provider below does the same thing a step earlier, so the
     * import throws unless the codegen wrote the barrel before the app booted
     */
    const barrelUrl = new URL('.adonisjs/server/controllers.ts', fs.baseUrl).href
    ace.app.rcFile.providers.push({
      environment: ['web'],
      file: async () => ({
        default: class RoutesProvider {
          constructor(protected app: ApplicationService) {}

          async boot() {
            const { controllers } = await import(barrelUrl)
            const router = await this.app.container.make('router')
            router.get('/users', [controllers.Users, 'index']).as('users.index')
          }
        },
      }),
    })

    const command = await ace.create(Codegen, [])
    await command.exec()

    assert.equal(command.exitCode, 0)
    await assert.fileContains('.adonisjs/server/routes.d.ts', ['users.index'])
  })
})
