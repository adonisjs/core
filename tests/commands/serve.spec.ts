/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import Serve from '../../commands/serve.ts'
import { AceFactory } from '../../factories/core/ace.ts'
import { setupTypeScriptProject } from '../helpers.ts'

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

  test('correctly pass hooks to the DevServer', async ({ assert, fs, cleanup }) => {
    assert.plan(1)
    await fs.create('bin/server.ts', `process.send({ isAdonisJS: true, environment: 'web' });`)

    await setupTypeScriptProject()

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })

    ace.app.rcFile.hooks = {
      devServerStarted: [
        async () => ({
          default: async () => {
            console.log('ere>')
            assert.isTrue(true)
          },
        }),
      ],
    }

    ace.ui.switchMode('raw')

    const command = await ace.create(Serve, ['--no-clear'])
    cleanup(() => command.devServer.close())
    await command.exec()
    await sleep(1200)
  })

  test('error if --hmr and --watch are used together', async ({ assert, fs }) => {
    await fs.create('node_modules/ts-node-maintained/esm.js', '')

    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => import(filePath),
    })

    ace.ui.switchMode('raw')

    const command = await ace.create(Serve, ['--hmr', '--watch', '--no-clear'])
    await command.exec()

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Cannot use --watch and --hmr flags together/)
  })
})
