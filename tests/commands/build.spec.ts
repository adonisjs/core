/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import ts from 'typescript'
import { execa } from 'execa'
import { test } from '@japa/runner'
import Build from '../../commands/build.js'
import { AceFactory } from '../../factories/core/ace.js'

test.group('Build command', () => {
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

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Unable to import "@adonisjs\/assembler/)
  })

  test('show error when typescript is not installed', async ({ assert, fs }) => {
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

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Unable to import "typescript/)
  })

  test('show error when tsconfig file is missing', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot read file/)
  })

  test('build project inside build directory', async ({ assert, fs }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({
        include: ['**/*'],
        exclude: [],
      })
    )

    await fs.create('.adonisrc.json', JSON.stringify({}))
    await fs.create('index.ts', '')
    await fs.create(
      'package.json',
      JSON.stringify({
        name: 'app',
        dependencies: {
          typescript: ts.version,
        },
      })
    )

    await execa('npm', ['install'], {
      cwd: fs.basePath,
      stdio: 'inherit',
    })

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 0)

    await assert.fileExists('build/index.js')
    await assert.fileExists('build/.adonisrc.json')
  }).timeout(30 * 1000)

  test('do not output when typescript build has errors', async ({ assert, fs }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({
        include: ['**/*'],
        exclude: [],
        compilerOptions: {
          target: 'ESNext',
          module: 'NodeNext',
          lib: ['ESNext'],
          strict: true,
          noUnusedLocals: true,
        },
      })
    )

    await fs.create('.adonisrc.json', JSON.stringify({}))
    await fs.create('index.ts', 'const foo = `a`')
    await fs.create(
      'package.json',
      JSON.stringify({
        name: 'app',
        dependencies: {
          typescript: ts.version,
        },
      })
    )

    await execa('npm', ['install'], {
      cwd: fs.basePath,
      stdio: 'inherit',
    })

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    await assert.fileNotExists('build/index.js')
  }).timeout(30 * 1000)

  test('output with --ignore-ts-errors flags when typescript build has errors', async ({
    assert,
    fs,
  }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({
        include: ['**/*'],
        exclude: [],
        compilerOptions: {
          target: 'ESNext',
          module: 'NodeNext',
          lib: ['ESNext'],
          strict: true,
          noUnusedLocals: true,
        },
      })
    )

    await fs.create('.adonisrc.json', JSON.stringify({}))
    await fs.create('index.ts', 'const foo = `a`')
    await fs.create(
      'package.json',
      JSON.stringify({
        name: 'app',
        dependencies: {
          typescript: ts.version,
        },
      })
    )

    await execa('npm', ['install'], {
      cwd: fs.basePath,
      stdio: 'inherit',
    })

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Build, [])
    command.ignoreTsErrors = true
    await command.exec()

    assert.equal(command.exitCode, 0)
    await assert.fileExists('build/index.js')
    await assert.fileExists('build/.adonisrc.json')
  }).timeout(30 * 1000)
})
