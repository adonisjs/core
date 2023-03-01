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

    const command = await ace.create(Serve, [])
    await command.exec()
    await sleep(100)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Unable to import "@adonisjs\/assembler/)
  })

  test('show error when bin/server.js file is missing', async ({ assert, fs }) => {
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

    const command = await ace.create(Serve, [])
    await command.exec()

    await sleep(100)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to connect to underlying HTTP server process'
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

    const command = await ace.create(Serve, [])
    command.watch = true
    await command.exec()

    await sleep(100)

    assert.equal(command.exitCode, 1)
    assert.lengthOf(ace.ui.logger.getLogs(), 1)
    assert.equal(ace.ui.logger.getLogs()[0].stream, 'stderr')
    assert.match(ace.ui.logger.getLogs()[0].message, /Unable to import "typescript/)
  })

  test('show error in watch mode when tsconfig file is missing', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl, {
      importer: (filePath) => {
        return import(filePath)
      },
    })
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(Serve, [])
    command.watch = true
    await command.exec()

    await sleep(100)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to connect to underlying HTTP server process'
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

    const command = await ace.create(Serve, [])
    command.watch = true
    await command.exec()

    await sleep(100)

    assert.equal(command.exitCode, 1)
    assert.exists(
      ace.ui.logger.getLogs().find(({ message }) => {
        return message === '[ yellow(warn) ] unable to connect to underlying HTTP server process'
      })
    )
  })
})
