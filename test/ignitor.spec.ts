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
import { Filesystem } from '@poppinss/dev-utils'

import { Ignitor } from '../src/Ignitor'
import { setupApplicationFiles } from '../test-helpers'

const fs = new Filesystem(join(__dirname, '__app'))

test.group('Ignitor | App Provider', (group) => {
	group.before(() => {
		process.env.ENV_SILENT = 'true'
	})

	group.beforeEach(() => {
		process.env.NODE_ENV = 'testing'
	})

	group.after(async () => {
		await fs.cleanup()
		delete process.env.ENV_SILENT
		delete process.env.APP_KEY
	})

	group.afterEach(async () => {
		delete process.env.NODE_ENV
		await fs.cleanup()
	})

	test('setup cors before hooks when enabled is set to true', async (assert) => {
		await setupApplicationFiles(fs)

		await fs.add(
			'config/cors.ts',
			`
      export const enabled = true
      export const exposeHeaders = []
    `
		)

		const bootstrapper = new Ignitor(fs.basePath).bootstrapper()

		bootstrapper.setup()
		bootstrapper.registerProviders(false)
		await bootstrapper.bootProviders()

		const Server = bootstrapper.application.container.use('Adonis/Core/Server')
		assert.lengthOf(Server.hooks.hooks.before, 1)
	})

	test('setup cors before hooks when enabled is set to a function', async (assert) => {
		await setupApplicationFiles(fs)

		await fs.add(
			'config/cors.ts',
			`
      export const enabled = () => false
      export const exposeHeaders = []
    `
		)

		const bootstrapper = new Ignitor(fs.basePath).bootstrapper()

		bootstrapper.setup()
		bootstrapper.registerProviders(false)
		await bootstrapper.bootProviders()
		const Server = bootstrapper.application.container.use('Adonis/Core/Server')

		assert.lengthOf(Server.hooks.hooks.before, 1)
	})

	test('do not setup cors before hooks when enabled is set to false', async (assert) => {
		await setupApplicationFiles(fs)

		await fs.add(
			'config/cors.ts',
			`
      export const enabled = false
      export const exposeHeaders = []
    `
		)

		const bootstrapper = new Ignitor(fs.basePath).bootstrapper()

		bootstrapper.setup()
		bootstrapper.registerProviders(false)
		await bootstrapper.bootProviders()
		const Server = bootstrapper.application.container.use('Adonis/Core/Server')

		assert.lengthOf(Server.hooks.hooks.before, 0)
	})

	test('setup static assets before hooks when enabled is set to true', async (assert) => {
		await setupApplicationFiles(fs)

		await fs.add(
			'config/static.ts',
			`
      export const enabled = true
    `
		)

		const bootstrapper = new Ignitor(fs.basePath).bootstrapper()

		bootstrapper.setup()
		bootstrapper.registerProviders(false)
		await bootstrapper.bootProviders()

		const Server = bootstrapper.application.container.use('Adonis/Core/Server')
		assert.lengthOf(Server.hooks.hooks.before, 1)
	})

	test('register base health checkers', async (assert) => {
		await setupApplicationFiles(fs)

		const bootstrapper = new Ignitor(fs.basePath).bootstrapper()

		bootstrapper.setup()
		bootstrapper.registerProviders(false)
		await bootstrapper.bootProviders()

		const HealthCheck = bootstrapper.application.container.use('Adonis/Core/HealthCheck')
		assert.deepEqual(HealthCheck.servicesList, ['env', 'appKey'])
	})
})
