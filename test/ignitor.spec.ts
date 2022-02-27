/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/index.ts" />

import { test } from '@japa/runner'
import { pathToFileURL } from 'url'
import { Ignitor } from '../src/Ignitor'
import { setupApplicationFiles, fs } from '../test-helpers'

test.group('Ignitor | App Provider', (group) => {
  group.setup(() => {
    process.env.ENV_SILENT = 'true'
  })

  group.each.setup(() => {
    process.env.NODE_ENV = 'testing'
  })

  group.teardown(async () => {
    await fs.cleanup()
    delete process.env.ENV_SILENT
    delete process.env.APP_KEY
  })

  group.each.teardown(async () => {
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')
    delete process.env.NODE_ENV
    await fs.cleanup()
  })

  test('setup cors before hooks when enabled is set to true', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = true
      export const exposeHeaders = []
    `
    )

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const Server = httpServer.application.container.use('Adonis/Core/Server')
    assert.lengthOf(Server.hooks['hooks'].before, 1)

    await httpServer.close()
  })

  test('setup cors before hooks when enabled is set to a function', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = () => false
      export const exposeHeaders = []
    `
    )

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const Server = httpServer.application.container.use('Adonis/Core/Server')
    assert.lengthOf(Server.hooks['hooks'].before, 1)

    await httpServer.close()
  })

  test('do not setup cors before hooks when enabled is set to false', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/cors.ts',
      `
      export const enabled = false
      export const exposeHeaders = []
    `
    )

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const Server = httpServer.application.container.use('Adonis/Core/Server')
    assert.lengthOf(Server.hooks['hooks'].before, 0)

    await httpServer.close()
  })

  test('setup static assets before hooks when enabled is set to true', async ({ assert }) => {
    await setupApplicationFiles()

    await fs.add(
      'config/static.ts',
      `
      export const enabled = true
    `
    )

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const Server = httpServer.application.container.use('Adonis/Core/Server')
    assert.lengthOf(Server.hooks['hooks'].before, 1)

    await httpServer.close()
  })

  test('register base health checkers', async ({ assert }) => {
    await setupApplicationFiles()

    const httpServer = new Ignitor(fs.basePath).httpServer()
    await httpServer.start()

    const HealthCheck = httpServer.application.container.use('Adonis/Core/HealthCheck')
    assert.deepEqual(HealthCheck.servicesList, ['env', 'appKey'])

    await httpServer.close()
  })

  test('construct ignitor with a file URL', async ({ assert }) => {
    await setupApplicationFiles()

    const entryPoint = fs.basePath + '/ace.js'
    const url = pathToFileURL(entryPoint).href
    const httpServer = new Ignitor(url).httpServer()

    assert.strictEqual(httpServer.application.appRoot, fs.basePath)
  })
})
