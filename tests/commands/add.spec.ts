/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { ListLoader } from '@adonisjs/ace'

import Add from '../../commands/add.ts'
import Configure from '../../commands/configure.ts'
import { AceFactory } from '../../factories/core/ace.ts'
import { setupPackage, setupNamedPackage, setupProject } from '../helpers.ts'

const VERBOSE = !!process.env.CI
const createFileImporter = (baseUrl: URL) => {
  return function (folder: string) {
    return import(new URL(`${folder}/index.js?${Math.random()}`, baseUrl).toString())
  }
}

test.group('Install', (group) => {
  group.tap((t) => t.disableTimeout())

  test('install packages using npm', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileIsNotEmpty('package-lock.json')
  })

  test('install package using pnpm', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'pnpm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileIsNotEmpty('pnpm-lock.yaml')
  })

  test('explicitly set the package manager to pnpm', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE
    command.packageManager = 'pnpm'

    await command.exec()

    await assert.fileIsNotEmpty('pnpm-lock.yaml')
  })

  test('install dependencies', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('package.json', '@adonisjs/foo')
  })

  test('install dev dependencies', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo', '-D'])
    command.verbose = VERBOSE

    await command.exec()

    const pkgJson = await fs.contentsJson('package.json')
    assert.deepEqual(pkgJson.devDependencies, { '@adonisjs/foo': 'file:packages/foo' })
  })

  test('pass unknown args to configure', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs, `command.logger.log(command.parsedFlags)`)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo', '--foo', '--auth=session', '-x'])
    command.verbose = VERBOSE

    await command.exec()

    const logs = command.logger.getLogs()

    assert.deepInclude(logs, {
      message: { foo: 'true', auth: 'session', x: 'true', ...(VERBOSE ? { verbose: true } : {}) },
      stream: 'stdout',
    })
  })

  test('configure package', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
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

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('adonisrc.ts', '@adonisjs/cache/cache_provider')
  })

  test('display error and stop if package install fail', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/nonexistent'])
    command.verbose = VERBOSE

    await command.exec()

    command.assertExitCode(1)
    command.assertLogMatches(/exited with a non-zero status/)
  })

  test('display error if configure command fails', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs, 'throw new Error("Invalid configure")')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo'])
    command.verbose = VERBOSE
    ace.errorHandler.render = async function (error: Error) {
      command.logger.fatal(error)
    }

    await command.exec()

    command.assertExitCode(1)
    command.assertLogMatches(/Unable to configure/)
  })

  test('configure edge', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })

    await setupProject(fs, 'npm')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

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

    await setupProject(fs, 'npm')

    await ace.app.init()
    ace.addLoader(new ListLoader([Configure]))

    const command = await ace.create(Add, ['vinejs'])
    command.verbose = VERBOSE

    await command.exec()

    await assert.fileContains('package.json', '@vinejs/vine')
    await assert.fileContains('adonisrc.ts', '@adonisjs/core/providers/vinejs_provider')
  })

  test('install adonisjs dependencies as next version', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupPackage(fs)

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['@adonisjs/fold'])
    command.verbose = VERBOSE

    await command.exec()
    await assert.fileContains('package.json', /"@adonisjs\/fold":"\^[\d.]+/)
  })

  test('install and configure multiple packages', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupNamedPackage(fs, {
      name: 'foo',
      configureContent: `
        const codemods = await command.createCodemods()
        await codemods.updateRcFile((rcFile) => {
          rcFile.addProvider('@adonisjs/foo/foo_provider')
        })
      `,
    })
    await setupNamedPackage(fs, {
      name: 'bar',
      configureContent: `
        const codemods = await command.createCodemods()
        await codemods.updateRcFile((rcFile) => {
          rcFile.addProvider('@adonisjs/bar/bar_provider')
        })
      `,
    })

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo', './packages/bar'])
    command.verbose = VERBOSE

    await command.exec()

    command.assertExitCode(0)
    await assert.fileContains('package.json', '@adonisjs/foo')
    await assert.fileContains('package.json', '@adonisjs/bar')
    await assert.fileContains('adonisrc.ts', '@adonisjs/foo/foo_provider')
    await assert.fileContains('adonisrc.ts', '@adonisjs/bar/bar_provider')
    command.assertLogMatches(/Installed and configured/)
  })

  test('continue configuring other packages when one fails', async ({ fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupNamedPackage(fs, {
      name: 'foo',
      configureContent: `throw new Error("Configure failed")`,
    })
    await setupNamedPackage(fs, {
      name: 'bar',
      configureContent: `
        const codemods = await command.createCodemods()
        await codemods.updateRcFile((rcFile) => {
          rcFile.addProvider('@adonisjs/bar/bar_provider')
        })
      `,
    })

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')
    ace.errorHandler.render = async () => {}

    const command = await ace.create(Add, ['./packages/foo', './packages/bar'])
    command.verbose = VERBOSE

    await command.exec()

    command.assertExitCode(1)
    command.assertLogMatches(/Unable to configure.*foo/)
    command.assertLogMatches(/Installed and configured.*bar/)
  })

  test('pass unknown flags to all configure commands', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: createFileImporter(fs.baseUrl),
    })

    await setupProject(fs, 'npm')
    await setupNamedPackage(fs, {
      name: 'foo',
      configureContent: `command.logger.log({ pkg: 'foo', flags: command.parsedFlags })`,
    })
    await setupNamedPackage(fs, {
      name: 'bar',
      configureContent: `command.logger.log({ pkg: 'bar', flags: command.parsedFlags })`,
    })

    await ace.app.init()

    ace.addLoader(new ListLoader([Configure]))
    ace.ui.switchMode('raw')

    const command = await ace.create(Add, ['./packages/foo', './packages/bar', '--auth=session'])
    command.verbose = VERBOSE

    await command.exec()

    const logs = command.logger.getLogs()
    const fooLog = logs.find((log: any) => log.message?.pkg === 'foo')
    const barLog = logs.find((log: any) => log.message?.pkg === 'bar')

    assert.equal((fooLog?.message as any)?.flags?.auth, 'session')
    assert.equal((barLog?.message as any)?.flags?.auth, 'session')
  })
})
