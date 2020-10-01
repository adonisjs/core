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
import stripAnsi from 'strip-ansi'
import { stdout, stderr } from 'test-console'

import { Ignitor } from '../src/Ignitor'
import { setupApplicationFiles, fs } from '../test-helpers'

test.group('Ignitor | Ace | Generate Manifest', (group) => {
	group.before(() => {
		process.env.MODULE_TESTING = 'true'
	})

	group.after(async () => {
		delete process.env.MODULE_TESTING
		await fs.cleanup()
	})

	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('generate manifest file', async (assert) => {
		await setupApplicationFiles()
		const { output, restore } = stdout.inspect()

		/**
		 * Overwriting .adonisrc.json
		 */
		await fs.add(
			'.adonisrc.json',
			JSON.stringify({
				typescript: true,
				commands: ['./FooCommand'],
				providers: [join(__dirname, '../providers/AppProvider.ts')],
			})
		)

		await fs.add(
			'FooCommand.ts',
			`
      const { BaseCommand } = require('@adonisjs/ace')
      module.exports = class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        handle () {}
      }
    `
		)

		const ignitor = new Ignitor(fs.basePath)
		await ignitor.ace().handle(['generate:manifest'])
		restore()

		const aceManifest = await fs.fsExtra.readJson(join(fs.basePath, './ace-manifest.json'))
		assert.deepEqual(aceManifest, {
			foo: {
				settings: {},
				commandPath: './FooCommand',
				commandName: 'foo',
				description: '',
				args: [],
				flags: [],
			},
		})

		assert.equal(
			stripAnsi(output[0]).split('create')[1].replace(/]/, '').trim(),
			'ace-manifest.json file'
		)
	})

	test('print helpful error message when command has ioc container imports', async (assert) => {
		await setupApplicationFiles()
		const { output, restore } = stderr.inspect()

		/**
		 * Overwriting .adonisrc.json
		 */
		await fs.add(
			'.adonisrc.json',
			JSON.stringify({
				typescript: true,
				commands: ['./FooCommand'],
				providers: [join(__dirname, '../providers/AppProvider.ts')],
			})
		)

		await fs.add(
			'FooCommand.ts',
			`
			import { BaseCommand } from '@adonisjs/ace'
			global[Symbol.for('ioc.use')]('Adonis/Core/Env')

			export default class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        run () {}
      }
    `
		)

		const ignitor = new Ignitor(fs.basePath)
		await ignitor.ace().handle(['generate:manifest'])
		restore()

		const hasManifestFile = await fs.fsExtra.pathExists(join(fs.basePath, './ace-manifest.json'))
		assert.isFalse(hasManifestFile)

		assert.match(
			stripAnsi(output[0]).trim(),
			/Top level IoC container imports are not allowed in commands./
		)
	})
})

test.group('Ignitor | Ace | Run Command', (group) => {
	group.before(() => {
		process.env.MODULE_TESTING = 'true'
	})

	group.after(async () => {
		delete process.env.MODULE_TESTING
		await fs.cleanup()
	})

	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('run command without loading the app', async (assert) => {
		await setupApplicationFiles()

		/**
		 * Overwriting .adonisrc.json
		 */
		await fs.add(
			'.adonisrc.json',
			JSON.stringify({
				typescript: true,
				commands: ['./FooCommand'],
				providers: [join(__dirname, '../providers/AppProvider.ts')],
			})
		)

		await fs.add(
			'FooCommand.ts',
			`
      const { BaseCommand } = require('@adonisjs/ace')
      export default class FooCommand extends BaseCommand {
				public static get settings() {
					return {
						stayAlive: true
					}
				}

        public static get commandName () {
          return 'foo'
        }

        public run () {
          console.log(\`is ready \${this.application.isReady}\`)
        }
      }
    `
		)

		const ignitor = new Ignitor(fs.basePath)
		await ignitor.ace().handle(['generate:manifest'])

		const { output, restore } = stdout.inspect()
		await ignitor.ace().handle(['foo'])
		restore()

		assert.equal(output[0].trim(), 'is ready false')
	})

	test('load app when command setting loadApp is true', async (assert) => {
		await setupApplicationFiles()

		/**
		 * Overwriting .adonisrc.json
		 */
		await fs.add(
			'.adonisrc.json',
			JSON.stringify({
				typescript: true,
				commands: ['./FooCommand'],
				providers: [join(__dirname, '../providers/AppProvider.ts')],
			})
		)

		await fs.add(
			'FooCommand.ts',
			`
      const { BaseCommand } = require('@adonisjs/ace')
      export default class FooCommand extends BaseCommand {
        static get commandName () {
          return 'foo'
        }

        static get settings () {
          return {
						loadApp: true,
						stayAlive: true
          }
        }

        run () {
          console.log(\`is ready \${this.application.isReady}\`)
        }
      }
    `
		)

		const ignitor = new Ignitor(fs.basePath)
		await ignitor.ace().handle(['generate:manifest'])

		const { output, restore } = stdout.inspect()
		await ignitor.ace().handle(['foo'])
		restore()

		assert.equal(output[0].trim(), 'is ready true')
	})

	test('print error when command is missing', async (assert) => {
		await setupApplicationFiles()

		/**
		 * Overwriting .adonisrc.json
		 */
		await fs.add(
			'.adonisrc.json',
			JSON.stringify({
				typescript: true,
				providers: [join(__dirname, '../providers/AppProvider.ts')],
			})
		)

		const ignitor = new Ignitor(fs.basePath)
		await ignitor.ace().handle(['generate:manifest'])

		const { output, restore } = stderr.inspect()
		await ignitor.ace().handle(['foo'])
		restore()

		assert.match(output[0].trim(), /"foo" command not found/)
	})

	test('print error when manifest file is missing', async (assert) => {
		await setupApplicationFiles()

		const ignitor = new Ignitor(fs.basePath)

		const { output, restore } = stderr.inspect()
		await ignitor.ace().handle(['foo'])
		restore()

		assert.match(
			output[0].trim(),
			/Run "node ace generate:manifest" before running any other ace command/
		)
	})
})
