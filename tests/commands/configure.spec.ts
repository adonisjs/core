/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import Configure from '../../commands/configure.js'
import { AceFactory } from '../../factories/core/ace.js'

const BASE_URL = new URL('./tmp/', import.meta.url)
const BASE_PATH = fileURLToPath(BASE_URL)

test.group('Configure command | list dependencies', (group) => {
  group.each.disableTimeout()

  test('list development dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    const codemods = await command.createCodemods()
    await codemods.listPackagesToInstall([
      {
        name: '@japa/runner',
        isDevDependency: true,
      },
      {
        name: '@japa/preset-adonis',
        isDevDependency: true,
      },
      {
        name: 'playwright',
        isDevDependency: true,
      },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: ['Please install following packages'].join('\n'),
        stream: 'stdout',
      },
      {
        message: ['yellow(npm i -D) @japa/runner @japa/preset-adonis playwright'].join('\n'),
        stream: 'stdout',
      },
      {
        message: [''].join('\n'),
        stream: 'stdout',
      },
    ])
  })

  test('list development and prod dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    const codemods = await command.createCodemods()
    await codemods.listPackagesToInstall([
      {
        name: '@japa/runner',
        isDevDependency: true,
      },
      {
        name: '@japa/preset-adonis',
        isDevDependency: true,
      },
      {
        name: 'playwright',
        isDevDependency: false,
      },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: ['Please install following packages'].join('\n'),
        stream: 'stdout',
      },
      {
        message: ['yellow(npm i -D) @japa/runner @japa/preset-adonis'].join('\n'),
        stream: 'stdout',
      },
      {
        message: ['yellow(npm i) playwright'].join('\n'),
        stream: 'stdout',
      },
    ])
  })

  test('list prod dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    const codemods = await command.createCodemods()
    await codemods.listPackagesToInstall([
      {
        name: 'playwright',
        isDevDependency: false,
      },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: ['Please install following packages'].join('\n'),
        stream: 'stdout',
      },
      {
        message: [].join('\n'),
        stream: 'stdout',
      },
      {
        message: ['yellow(npm i) playwright'].join('\n'),
        stream: 'stdout',
      },
    ])
  })
})

test.group('Configure command | run', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = BASE_PATH
  })

  group.each.disableTimeout()

  test('error when unable to import package', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: async (filePath) => {
        await import(filePath)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['./dummy-pkg.js'])
    await command.exec()

    command.assertLog('[ red(error) ] Cannot find module "./dummy-pkg.js". Make sure to install it')
    assert.equal(command.exitCode, 1)
  })

  test('error when package cannot be configured', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('dummy-pkg.js', `export const stubsRoot = './'`)

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=1'])
    await command.exec()

    command.assertLog(
      '[ red(error) ] Cannot configure module "./dummy-pkg.js?v=1". The module does not export the configure hook'
    )
    assert.equal(command.exitCode, 1)
  })

  test('run package configure method', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export function configure (command) {
        command.result = 'configured'
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=2'])
    await command.exec()
    assert.equal(command.result, 'configured')
  })

  test('install packages', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('package.json', { type: 'module' })
    await fs.createJson('tsconfig.json', {})
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        const codemods = await command.createCodemods()
        await codemods.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true },
          { name: 'is-even@1.0.0', isDevDependency: false }
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=3'])
    command.verbose = true
    await command.exec()

    assert.equal(command.exitCode, 0)
    const packageJson = await fs.contentsJson('package.json')
    assert.deepEqual(packageJson.dependencies, { 'is-even': '^1.0.0' })
    assert.deepEqual(packageJson.devDependencies, { 'is-odd': '^2.0.0' })
  })

  test('install packages using pnpm when pnpm-lock file exists', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('pnpm-lock.yaml', '')
    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        const codemods = await command.createCodemods()
        await codemods.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=4'])
    await command.exec()

    command.assertSucceeded()
    command.assertLog('[ cyan(wait) ] installing dependencies using pnpm  .  ')
  })

  test('install packages using npm when package-lock file exists', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('package-lock.json', {})
    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        const codemods = await command.createCodemods()
        await codemods.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=5'])
    await command.exec()

    command.assertSucceeded()
    command.assertLog('[ cyan(wait) ] installing dependencies using npm  .  ')
  })

  test('display error when installation fails', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('package-lock.json', {})
    await fs.createJson('tsconfig.json', {})
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        const codemods = await command.createCodemods()
        await codemods.installPackages([
          { name: 'is-odd@15.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=6'])
    await command.exec()

    command.assertFailed()

    const logs = ace.ui.logger.getLogs()
    assert.deepInclude(logs, {
      message: '[ cyan(wait) ] unable to install dependencies ...',
      stream: 'stdout',
    })

    const lastLog = logs[logs.length - 1]
    assert.equal(command.exitCode, 1)
    assert.deepInclude(
      lastLog.message,
      '[ red(error) ] Command failed with exit code 1: npm install -D is-odd@15.0.0'
    )
  })
})

test.group('Configure command | vinejs', (group) => {
  group.each.disableTimeout()

  test('register vinejs provider', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', 'export default defineConfig({})')

    const command = await ace.create(Configure, ['vinejs'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    await command.run()

    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', '@adonisjs/core/providers/vinejs_provider')
  })
})

test.group('Configure command | edge', (group) => {
  group.each.disableTimeout()

  test('register edge provider', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', 'export default defineConfig({})')

    const command = await ace.create(Configure, ['edge'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    await command.run()

    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update adonisrc.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('adonisrc.ts', '@adonisjs/core/providers/edge_provider')
    await assert.fileContains(
      'adonisrc.ts',
      `metaFiles: [{
    pattern: 'resources/views/**/*.edge',
    reloadServer: false,
  }]`
    )
  })
})
