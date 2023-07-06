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

test.group('Configure command | stubs', () => {
  test('publish stub using configure command', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    /**
     * Creating a dummy config stub
     */
    await fs.create(
      'stubs/cors/config.stub',
      ['---', "to: {{ app.configPath('cors.ts') }}", '---', 'export default { cors: true }'].join(
        '\n'
      )
    )

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    /**
     * Publishing the stub
     */
    await command.publishStub('cors/config.stub')

    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create config/cors.ts',
        stream: 'stdout',
      },
    ])
    assert.fileExists('config/cors.ts')
  })

  test('skip publishing when file already exists', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    /**
     * Creating a dummy config stub
     */
    await fs.create(
      'stubs/cors/config.stub',
      ['---', "to: {{ app.configPath('cors.ts') }}", '---', 'export default { cors: true }'].join(
        '\n'
      )
    )

    await fs.create('config/cors.ts', 'export default { cors: true }')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    /**
     * Publishing the stub
     */
    await command.publishStub('cors/config.stub')

    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'cyan(SKIPPED:) create config/cors.ts dim((File already exists))',
        stream: 'stdout',
      },
    ])
  })
})

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

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    await command.defineEnvVariables({ CORS_MODE: 'strict', CORS_ENABLED: true })
    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update .env file',
        stream: 'stdout',
      },
      {
        message: [
          '               dim(CORS_MODE=strict)',
          '               dim(CORS_ENABLED=true)',
        ].join('\n'),
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

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    await command.defineEnvVariables({ CORS_MODE: 'strict', CORS_ENABLED: true })
    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update .env file',
        stream: 'stdout',
      },
      {
        message: [
          '               dim(CORS_MODE=strict)',
          '               dim(CORS_ENABLED=true)',
        ].join('\n'),
        stream: 'stdout',
      },
    ])

    await assert.fileNotExists('.env')
  })
})

test.group('Configure command | rcFile', () => {
  test('update rcfile', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    await command.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core')
    })

    assert.deepEqual(command.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    update .adonisrc.json file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains('.adonisrc.json', '@adonisjs/core')
  })
})

test.group('Configure command | list dependencies', () => {
  test('list development dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    command.listPackagesToInstall([
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
        message: [
          'Please install following packages',
          'dim(# npm)',
          'yellow(npm i -D) @japa/runner @japa/preset-adonis playwright',
          ' ',
          'dim(# yarn)',
          'yellow(yarn add -D) @japa/runner @japa/preset-adonis playwright',
          ' ',
          'dim(# pnpm)',
          'yellow(pnpm add -D) @japa/runner @japa/preset-adonis playwright',
        ].join('\n'),
        stream: 'stdout',
      },
    ])
  })

  test('list development and prod dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    command.listPackagesToInstall([
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
        message: [
          'Please install following packages',
          'dim(# npm)',
          'yellow(npm i -D) @japa/runner @japa/preset-adonis',
          'yellow(npm i) playwright',
          ' ',
          'dim(# yarn)',
          'yellow(yarn add -D) @japa/runner @japa/preset-adonis',
          'yellow(yarn add) playwright',
          ' ',
          'dim(# pnpm)',
          'yellow(pnpm add -D) @japa/runner @japa/preset-adonis',
          'yellow(pnpm add) playwright',
        ].join('\n'),
        stream: 'stdout',
      },
    ])
  })

  test('list prod dependencies to install', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../dummy-pkg.js'])
    command.stubsRoot = join(fs.basePath, 'stubs')

    command.listPackagesToInstall([
      {
        name: 'playwright',
        isDevDependency: false,
      },
    ])

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: [
          'Please install following packages',
          'dim(# npm)',
          'yellow(npm i) playwright',
          ' ',
          'dim(# yarn)',
          'yellow(yarn add) playwright',
          ' ',
          'dim(# pnpm)',
          'yellow(pnpm add) playwright',
        ].join('\n'),
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

  test('throw error when unable to import package', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['./dummy-pkg.js'])
    await command.exec()

    assert.match(command.error.message, /Cannot find module/)
    assert.equal(command.exitCode, 1)
  })

  test('fail when package has configure method but not the stubsRoot', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('dummy-pkg.js', `export function configure() {}`)

    const command = await ace.create(Configure, ['./dummy-pkg.js'])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ red(error) ] Missing "stubsRoot" export from "./dummy-pkg.js" package. The stubsRoot variable is required to lookup package stubs',
        stream: 'stderr',
      },
    ])
  })

  test('warn when package cannot be configured', async ({ assert, fs }) => {
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

    assert.equal(command.exitCode, 0)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ yellow(warn) ] Cannot configure "./dummy-pkg.js?v=1" package. The package does not export the configure hook',
        stream: 'stdout',
      },
    ])
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

    await fs.create('pnpm-lock.yaml', '')
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        await command.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true },
          { name: 'is-even@1.0.0', isDevDependency: false }
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=3'])
    await command.exec()

    const packageJson = await fs.contentsJson('package.json')
    assert.deepEqual(packageJson.dependencies, { 'is-even': '1.0.0' })
    assert.deepEqual(packageJson.devDependencies, { 'is-odd': '2.0.0' })
  }).timeout(5000)

  test('install packages and detect pnpm', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('pnpm-lock.yaml', '')
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        await command.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=4'])
    await command.exec()

    const logs = ace.ui.logger.getLogs()
    assert.deepInclude(logs, {
      message: '[ cyan(wait) ] installing dependencies using pnpm .  ',
      stream: 'stdout',
    })
  }).timeout(5000)

  test('install packages and detect npm', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('package-lock.json', {})
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        await command.installPackages([
          { name: 'is-odd@2.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=5'])
    await command.exec()

    const logs = ace.ui.logger.getLogs()

    assert.deepInclude(logs, {
      message: '[ cyan(wait) ] installing dependencies using npm .  ',
      stream: 'stdout',
    })
  }).timeout(5000)

  test('display error when installing packages', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(new URL(filePath, fs.baseUrl).href)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('package-lock.json', {})
    await fs.createJson('package.json', { type: 'module' })
    await fs.create(
      'dummy-pkg.js',
      `
      export const stubsRoot = './'
      export async function configure (command) {
        await command.installPackages([
          { name: 'is-odd@15.0.0', isDevDependency: true, },
        ])
      }
    `
    )

    const command = await ace.create(Configure, ['./dummy-pkg.js?v=6'])
    await command.exec()

    const logs = ace.ui.logger.getLogs()
    assert.deepInclude(logs, {
      message: '[ cyan(wait) ] unable to install dependencies ...',
      stream: 'stdout',
    })

    const lastLog = logs[logs.length - 1]
    assert.deepInclude(
      lastLog.message,
      '[ red(error) ] Command failed with exit code 1: npm install -D is-odd@15.0.0'
    )
  }).timeout(5000)
})
