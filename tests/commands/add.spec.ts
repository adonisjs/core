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
import { ListLoader } from '@adonisjs/ace'
import type { FileSystem } from '@japa/file-system'

import Add from '../../commands/add.js'
import Configure from '../../commands/configure.js'
import { AceFactory } from '../../factories/core/ace.js'

const VERBOSE = !!process.env.CI

/**
 * Setup a fake adonis project in the file system
 */
async function setupProject(fs: FileSystem, pkgManager?: 'npm' | 'pnpm' | 'yarn' | 'yarn@berry') {
  await fs.create(
    'package.json',
    JSON.stringify({ type: 'module', name: 'test', dependencies: {} })
  )

  if (pkgManager === 'pnpm') {
    await fs.create('pnpm-lock.yaml', '')
  } else if (pkgManager === 'yarn' || pkgManager === 'yarn@berry') {
    await fs.create('yarn.lock', '')
  } else {
    await fs.create('package-lock.json', '')
  }

  await fs.create('tsconfig.json', JSON.stringify({ compilerOptions: {} }))
  await fs.create('adonisrc.ts', `export default defineConfig({})`)
  await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
  await fs.create('start/kernel.ts', `export default Env.create(new URL('./'), {})`)
  await fs.create('.env', '')
}

/**
 * Setup a fake package inside the node_modules directory
 */
async function setupPackage(fs: FileSystem, configureContent?: string) {
  await fs.create(
    'node_modules/foo/package.json',
    JSON.stringify({ type: 'module', name: 'test', main: 'index.js', dependencies: {} })
  )

  await fs.create(
    'node_modules/foo/index.js',
    `export const stubsRoot = './'
     export async function configure(command) { ${configureContent} }`
  )
}

test.group('Install', (group) => {
  group.tap((t) => t.disableTimeout())

  test('detect correct pkg manager ( npm )', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileIsNotEmpty('package-lock.json')
  })

  test('detect correct pkg manager ( pnpm )', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'pnpm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileIsNotEmpty('pnpm-lock.yaml')
  })

  test('use specific package manager', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE
    command.packageManager = 'pnpm'

    await command.exec()

    await assert.fileIsNotEmpty('pnpm-lock.yaml')
  })

  test('should install dependency', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('package.json', 'foo')
  })

  test('should install dev dependency', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href, '-D'])
    command.verbose = VERBOSE

    await command.exec()

    const pkgJson = await fs.contentsJson('package.json')
    assert.deepEqual(pkgJson.devDependencies, { test: 'file:node_modules/foo' })
  })

  test('pass unknown args to configure', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'npm')
    await setupPackage(
      fs,
      `
        command.logger.log(command.parsedFlags)
      `
    )

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [
      new URL('node_modules/foo', fs.baseUrl).href,
      '--foo',
      '--auth=session',
      '-x',
    ])
    command.verbose = VERBOSE

    await command.exec()

    const logs = command.logger.getLogs()

    assert.deepInclude(logs, {
      message: { foo: 'true', auth: 'session', x: 'true', ...(VERBOSE ? { verbose: true } : {}) },
      stream: 'stdout',
    })
  })

  test('should configure package', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'pnpm')
    await setupPackage(
      fs,
      ` const codemods = await command.createCodemods()
        await codemods.updateRcFile((rcFile) => {
          rcFile.addProvider('@adonisjs/cache/cache_provider')
        })`
    )

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('adonisrc.ts', '@adonisjs/cache/cache_provider')
  })

  test('display error and stop if package install fail', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'pnpm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [
      new URL('node_modules/inexistent', fs.baseUrl).toString(),
    ])
    command.verbose = VERBOSE

    await command.exec()

    command.assertExitCode(1)
    command.assertLogMatches(/Process exited with non-zero status/)
  })

  test('display error if configure fail', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(join(filePath, `index.js?${Math.random()}`)),
    })

    await setupProject(fs, 'pnpm')
    await setupPackage(fs, 'throw new Error("Invalid configure")')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, [new URL('node_modules/foo', fs.baseUrl).href])
    command.verbose = VERBOSE

    await command.exec()

    command.assertExitCode(1)
    command.assertLogMatches(/Invalid configure/)
  })

  test('configure edge', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })

    await setupProject(fs, 'pnpm')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, ['edge'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('package.json', 'edge.js')
    await assert.fileContains('adonisrc.ts', '@adonisjs/core/providers/edge_provider')
  })

  test('configure vinejs', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })

    await setupProject(fs, 'pnpm')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))
    ace.prompt.trap('install').accept()

    const command = await ace.create(Add, ['vinejs'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('package.json', '@vinejs/vine')
    await assert.fileContains('adonisrc.ts', '@adonisjs/core/providers/vinejs_provider')
  })
})
