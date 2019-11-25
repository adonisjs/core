/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import { join } from 'path'
import stripAnsi from 'strip-ansi'
import { stderr, stdout } from 'test-console'
import { Filesystem } from '@poppinss/dev-utils'

import { Ignitor } from '../src/Ignitor'
import { setupApplicationFiles, setupCompiledApplicationFiles } from '../test-helpers'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Ignitor | Ace', (group) => {
  group.before(() => {
    process.env.MODULE_TESTING = 'true'
  })

  group.after(async () => {
    delete process.env.MODULE_TESTING
    await fs.cleanup()
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('raise error when tsconfig file is missing', async (assert) => {
    await setupApplicationFiles(fs)
    const { output, restore } = stderr.inspect()

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])
    restore()

    assert.equal(
      stripAnsi(output[0]).trim(),
      `✖  error     Typescript projects must have "tsconfig.json" file inside the project root`,
    )
  })

  test('raise error when outdir inside tsconfig file is missing', async (assert) => {
    await setupApplicationFiles(fs)
    const { output, restore } = stderr.inspect()

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
    }))

    await fs.add('tsconfig.json', JSON.stringify({
    }))

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])
    restore()

    assert.equal(
      stripAnsi(output[0]).trim(),
      `✖  error     Make sure to define \"compilerOptions.outDir\" in tsconfig.json file`,
    )
  })
})

test.group('Ignitor | Ace | Generate Manifest', (group) => {
  group.before(() => {
    process.env.MODULE_TESTING = 'true'
  })

  group.after(async () => {
    delete process.env.MODULE_TESTING
    await fs.cleanup()
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('generate manifest file inside the build directory', async (assert) => {
    await setupApplicationFiles(fs)
    const { output, restore } = stdout.inspect()

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      commands: ['./FooCommand'],
      providers: [join(__dirname, '../providers/AppProvider.ts')],
    }))

    await fs.add('tsconfig.json', JSON.stringify({
      compilerOptions: {
        outDir: './build',
      },
    }))

    await fs.add('build/FooCommand.js', `
      const { BaseCommand } = require('@adonisjs/ace')
      module.exports = class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        handle () {}
      }
    `)

    await setupCompiledApplicationFiles(fs, 'build')

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])
    restore()

    const aceManifest = await fs.fsExtra.readJson(join(fs.basePath, './build/ace-manifest.json'))
    assert.deepEqual(aceManifest, {
      foo: {
        settings: {},
        commandPath: './FooCommand',
        commandName: 'foo',
        description: '',
        args: [],
        flags: [],
      },
    })

    assert.equal(
      stripAnsi(output[0]).trim(),
      `✔  create    ace-manifest.json`,
    )
  })

  test('do not load tsconfig.json when typescript inside rc file is false', async (assert) => {
    await setupApplicationFiles(fs)
    const { output, restore } = stdout.inspect()

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: false,
      providers: [join(__dirname, '../providers/AppProvider.ts')],
    }))

    await setupCompiledApplicationFiles(fs, 'build')

    const ignitor = new Ignitor(join(fs.basePath, 'build'))
    await ignitor.ace().handle(['generate:manifest'])
    restore()

    assert.equal(
      stripAnsi(output[0]).trim(),
      `✔  create    ace-manifest.json`,
    )
  })
})

test.group('Ignitor | Ace | Generate Manifest', (group) => {
  group.before(() => {
    process.env.MODULE_TESTING = 'true'
  })

  group.after(async () => {
    delete process.env.MODULE_TESTING
    await fs.cleanup()
  })

  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('run command without loading the app', async (assert) => {
    await setupApplicationFiles(fs)

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      commands: ['./FooCommand'],
      providers: [join(__dirname, '../providers/AppProvider.ts')],
    }))

    await fs.add('tsconfig.json', JSON.stringify({
      compilerOptions: {
        outDir: './build',
      },
    }))

    await fs.add('build/FooCommand.js', `
      const { BaseCommand } = require('@adonisjs/ace')
      module.exports = class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        handle () {
          console.log(\`is ready \${this.application.isReady}\`)
        }
      }
    `)

    await setupCompiledApplicationFiles(fs, 'build')

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])

    const { output, restore } = stdout.inspect()
    await ignitor.ace().handle(['foo'])
    restore()

    assert.equal(output[0].trim(), 'is ready false')
  })

  test('load app when command setting loadApp is true', async (assert) => {
    await setupApplicationFiles(fs)

    /**
     * Overwriting .adonisrc.json
     */
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      commands: ['./FooCommand'],
      providers: [join(__dirname, '../providers/AppProvider.ts')],
    }))

    await fs.add('tsconfig.json', JSON.stringify({
      compilerOptions: {
        outDir: './build',
      },
    }))

    await fs.add('build/FooCommand.js', `
      const { BaseCommand } = require('@adonisjs/ace')
      module.exports = class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        static get settings () {
          return {
            loadApp: true,
          }
        }

        handle () {
          console.log(\`is ready \${this.application.isReady}\`)
        }
      }
    `)

    await setupCompiledApplicationFiles(fs, 'build')

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.ace().handle(['generate:manifest'])

    const { output, restore } = stdout.inspect()
    await ignitor.ace().handle(['foo'])
    restore()

    assert.equal(output[0].trim(), 'is ready true')
  })
})
