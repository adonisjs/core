/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import Serve from '../../commands/serve.js'
import { AceFactory } from '../../factories/core/ace.js'

const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration))

test.group('Serve command', () => {
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

    const command = await ace.create(Serve, ['--no-clear'])
    await command.exec()
    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "@adonisjs\/assembler/)
  })

  test('fail when bin/server.js file is missing', async ({ assert, fs, cleanup }) => {
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

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
  })

  test('show error in watch mode when typescript is not installed', async ({
    assert,
    fs,
    cleanup,
  }) => {
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

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
    command.watch = true
    await command.exec()

    await sleep(600)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot find package "typescript/)
  })

  test('fail in watch mode when tsconfig file is missing', async ({ assert, fs, cleanup }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
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

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
    command.watch = true
    await command.exec()

    await sleep(600)

    /**
     * In watch mode, we wait for errors to be fixed and then
     * re-start the process
     */
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

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
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

    ace.ui.switchMode('raw')

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
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

    const command = await ace.create(Serve, ['--no-assets', '--no-clear'])
    cleanup(() => command.devServer.close())
    await command.exec()
    await sleep(600)

    assert.notExists(
      ace.ui.logger.getLogs().find((log) => {
        return log.message.match(/starting "vite" dev server/)
      })
    )
  })
})
