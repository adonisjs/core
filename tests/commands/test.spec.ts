/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import Test from '../../commands/test.ts'
import { AceFactory } from '../../factories/core/ace.ts'
import { setupTypeScriptProject } from '../helpers.ts'

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

  test('pass filters to bin/test.js script', async ({ assert, fs, cleanup }) => {
    await fs.create(
      'package.json',
      JSON.stringify({
        type: 'module',
      })
    )

    await fs.create(
      'bin/test.ts',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await setupTypeScriptProject()

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
      'bin/test.ts',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await setupTypeScriptProject()

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
      'bin/test.ts',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await setupTypeScriptProject()

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
      'bin/test.ts',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await setupTypeScriptProject()

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
      'bin/test.ts',
      `
      import { writeFile } from 'node:fs/promises'
      await writeFile('argv.json', JSON.stringify(process.argv.splice(2), null, 2))
    `
    )

    await setupTypeScriptProject()

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
