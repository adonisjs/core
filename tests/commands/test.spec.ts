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

  test('fail when bin/test.js file is missing', async ({ assert, fs, cleanup }) => {
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
    cleanup(() => command.testsRunner.close())
    await command.exec()

    await sleep(600)
    assert.equal(command.exitCode, 1)
  })

  test('fail in watch mode when typescript is not installed', async ({ assert, fs, cleanup }) => {
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
    cleanup(() => command.testsRunner.close())
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "typescript/)
  })

  test('show error in watch mode when tsconfig file is missing', async ({
    assert,
    fs,
    cleanup,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    cleanup(() => command.testsRunner.close())
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
  })

  test('do not fail in watch mode when ts-node is missing', async ({ assert, fs, cleanup }) => {
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
    cleanup(() => command.testsRunner.close())
    command.watch = true
    await command.exec()

    await sleep(600)
    assert.equal(command.exitCode, 0)
  })

  test('show error when configured assets bundler is missing', async ({ assert, fs, cleanup }) => {
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
      devServer: { command: 'vite' },
      build: { command: 'vite build' },
    }

    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-clear'])
    cleanup(() => command.testsRunner.close())
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
    cleanup,
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
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
  })

  test('do not attempt to serve assets when --no-assets flag is used', async ({
    assert,
    fs,
    cleanup,
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

    ace.app.rcFile.assetsBundler = {
      name: 'vite',
      build: { command: 'vite build' },
      devServer: { command: 'vite' },
    }

    ace.ui.switchMode('raw')

    const command = await ace.create(Test, ['--no-assets', '--no-clear'])
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
  })

  test('pass filters to bin/test.js script', async ({ assert, fs, cleanup }) => {
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
      '--tests="2 + 2 = 4"',
    ])
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(
        ['--files', 'math.spec', '--groups', 'foo', '--tags', 'bar', '--tests', '2 + 2 = 4'],
        null,
        2
      )
    )
  })

  test('pass suites to bin/test.js script', async ({ assert, fs, cleanup }) => {
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
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    await assert.fileEquals('argv.json', JSON.stringify(['unit', 'functional'], null, 2))
  })

  test('pass unknown flags to bin/test.js script', async ({ assert, fs, cleanup }) => {
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
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(['--browser', 'firefox', '--inspect'], null, 2)
    )
  })

  test('pass unknown flags with array values to bin/test.js script', async ({
    assert,
    fs,
    cleanup,
  }) => {
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
    cleanup(() => command.testsRunner.close())
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(['--browser', 'firefox', '--browser', 'chrome', '--inspect'], null, 2)
    )
  })

  test('pass all japa flags to the script', async ({ assert, fs, cleanup }) => {
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
      '--reporters=ndjson,spec',
      '--failed',
      '--retries=2',
      '--timeout=3000',
    ])
    cleanup(() => command.testsRunner.close())
    await command.exec()
    await sleep(600)

    await assert.fileEquals(
      'argv.json',
      JSON.stringify(
        ['--reporters', 'ndjson,spec', '--timeout', '3000', '--failed', '--retries', '2'],
        null,
        2
      )
    )
  })
})
