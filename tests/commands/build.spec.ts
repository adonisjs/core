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

test.group('Build command', (group) => {
  group.tap((t) => t.timeout(30 * 1000))

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
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "@adonisjs\/assembler/)
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
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "typescript/)
  })

  test('fail when tsconfig file is missing', async ({ assert, fs }) => {
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
  })

  test('build project inside build directory', async ({ assert, fs }) => {
    await fs.create(
      'tsconfig.json',
      JSON.stringify({
        include: ['**/*'],
        compilerOptions: { skipLibCheck: true },
        exclude: [],
      })
    )

    await fs.create('adonisrc.ts', `export default {}`)
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
    await assert.fileExists('build/adonisrc.js')
  })

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

    await fs.create('adonisrc.ts', `export default {}`)
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
  })

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

    await fs.create('adonisrc.ts', `export default {}`)
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
    await assert.fileExists('build/adonisrc.js')
  })

  test('show error when configured assets bundler is missing', async ({ assert, fs }) => {
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

    await fs.create('adonisrc.ts', `export default {}`)
    await fs.create('index.ts', '')

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

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/compiling frontend assets/)
      })
    )
  })

  test('do not attempt to build assets when assets bundler is not configured', async ({
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

    await fs.create('adonisrc.ts', `export default {}`)
    await fs.create('index.ts', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })

    ace.ui.switchMode('raw')

    const command = await ace.create(Build, [])
    await command.exec()

    assert.equal(command.exitCode, 0)
    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/compiling frontend assets/)
      })
    )
  })

  test('do not attempt to build assets when --no-assets flag is used', async ({ assert, fs }) => {
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

    await fs.create('adonisrc.ts', `export default {}`)
    await fs.create('index.ts', '')

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

    ace.ui.switchMode('normal')

    const command = await ace.create(Build, ['--no-assets'])
    await command.exec()

    assert.equal(command.exitCode, 0)
    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/compiling frontend assets/)
      })
    )
  })
})
