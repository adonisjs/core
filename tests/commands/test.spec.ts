/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import Test from '../../commands/test.js'
import { AceFactory } from '../../factories/core/ace.js'

const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration))

test.group('Test command', () => {
  test('show error when assembler is not installed', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        if (filePath === '@adonisjs/assembler') {
          return import(new URL(filePath, fs.baseUrl).href)
        }

        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    await command.exec()
    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "@adonisjs\/assembler/)
  })

  test('show error when bin/test.js file is missing', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        if (filePath === 'typescript') {
          return import(new URL(filePath, fs.baseUrl).href)
        }

        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to run test script "bin/test.js"'
      })
    )
  })

  test('show error in watch mode when typescript is not installed', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        if (filePath === 'typescript') {
          return import(new URL(filePath, fs.baseUrl).href)
        }

        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "typescript/)
  })

  test('show error iddn watch mode when tsconfig file is missing', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to run test script "bin/test.js"'
      })
    )
  })

  test('show error in watch mode when ts-node is missing', async ({ assert, fs }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({
        include: ['**/*'],
        exclude: [],
      })
    )

    await fs.create('index.ts', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to run test script "bin/test.js"'
      })
    )
  })

  test('show error when configured assets bundler is missing', async ({ assert, fs }) => {
    await fs.create('bin/server.js', '')
    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.app.rcFile.assetsBundler = {
      name: 'vite',
      devServerCommand: 'vite',
      buildCommand: 'vite build',
    }

    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    await command.exec()
    await sleep(600)

    assert.exists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
    assert.exists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/unable to connect to "vite" dev server/)
      })
    )
  })

  test('do not attempt to serve assets when assets bundler is not configured', async ({
    assert,
    fs,
  }) => {
    await fs.create('bin/test.js', '')
    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    await command.exec()
    await sleep(600)

    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
  })

  test('do not attempt to serve assets when --no-assets flag is used', async ({ assert, fs }) => {
    await fs.create('bin/test.js', '')
    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.app.rcFile.assetsBundler = {
      name: 'vite',
      devServerCommand: 'vite',
      buildCommand: 'vite build',
    }

    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-assets', '--no-clear'])
    await command.exec()
    await sleep(600)

    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
  })

  test('pass filters to bin/test.js script', async ({ assert, fs }) => {
    await fs.create(
      'package.json',
      JSON.stringify({
        type: 'module',
      })
    )

    await fs.create(
      'bin/test.js',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )

    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')
    ace.app.rcFile.tests.suites = [
      {
        name: 'unit',
        files: ['tests/unit/**/*.spec(.js|.ts)'],
        directories: ['tests/unit'],
      },
    ]

    const command = await ace.create(Test, [
      '--no-clear',
      '--files=math.spec',
      '--groups=foo',
      '--tags=bar',
      '--ignore-tags=baz',
      '--test="2 + 2 = 4"',
    ])
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(
        [
          '--files',
          'math.spec',
          '--groups',
          'foo',
          '--tags',
          'bar',
          '--ignore-tags',
          'baz',
          '--test',
          '2 + 2 = 4',
        ],
        null,
        2
      )
    )
  })

  test('pass suites to bin/test.js script', async ({ assert, fs }) => {
    await fs.create(
      'package.json',
      JSON.stringify({
        type: 'module',
      })
    )

    await fs.create(
      'bin/test.js',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')
    ace.app.rcFile.tests.suites = [
      {
        name: 'unit',
        files: 'tests/unit/**/*.spec(.js|.ts)',
        directories: ['tests/unit'],
      },
    ]

    const command = await ace.create(Test, ['unit', 'functional', '--no-clear'])
    await command.exec()
    await sleep(600)

    await assert.fileEquals('argv.json', JSON.stringify(['unit', 'functional'], null, 2))
  })

  test('pass unknown flags to bin/test.js script', async ({ assert, fs }) => {
    await fs.create(
      'package.json',
      JSON.stringify({
        type: 'module',
      })
    )

    await fs.create(
      'bin/test.js',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')
    ace.app.rcFile.tests.suites = [
      {
        name: 'unit',
        files: 'tests/unit/**/*.spec(.js|.ts)',
        directories: ['tests/unit'],
      },
    ]

    const command = await ace.create(Test, ['--browser=firefox', '--inspect', '--no-clear'])
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(['--browser', 'firefox', '--inspect'], null, 2)
    )
  })

  test('pass unknown flags with array values to bin/test.js script', async ({ assert, fs }) => {
    await fs.create(
      'package.json',
      JSON.stringify({
        type: 'module',
      })
    )

    await fs.create(
      'bin/test.js',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await fs.create(
      'node_modules/ts-node/package.json',
      JSON.stringify({
        name: 'ts-node',
        exports: {
          './esm': './esm.js',
        },
      })
    )
    await fs.create('node_modules/ts-node/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')
    ace.app.rcFile.tests.suites = [
      {
        name: 'unit',
        files: ['tests/unit/**/*.spec(.js|.ts)'],
        directories: ['tests/unit'],
      },
    ]

    const command = await ace.create(Test, [
      '--browser=firefox',
      '--browser=chrome',
      '--inspect',
      '--no-clear',
    ])
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(['--browser', 'firefox', '--browser', 'chrome', '--inspect'], null, 2)
    )
  })
})
