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
import supertest from 'supertest'
import { createServer } from 'http'

import { Ignitor } from '../src/Ignitor'
import { setupApplicationFiles, fs } from '../test-helpers'

test.group('Ignitor | Http', (group) => {
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
		process.removeAllListeners('SIGINT')
		process.removeAllListeners('SIGTERM')

		delete process.env.NODE_ENV
		await fs.cleanup()
	})

	test('call ready hook on providers before starting the http server', async (assert, done) => {
		await fs.add(
			'providers/AppProvider.ts',
			`
    export default class AppProvider {
			constructor (protected $app) {}

			public static needsApplication = true

      public async ready () {
        this.$app.container.use('Adonis/Core/Server').hookCalled = true
      }
    }
    `
		)

		await setupApplicationFiles(['./providers/AppProvider'])

		const httpServer = new Ignitor(fs.basePath).httpServer()
		await httpServer.start()

		const server = httpServer.application.container.use('Adonis/Core/Server')
		server.instance!.close(() => {
			done()
		})
		assert.isTrue(server['hookCalled'])
	})

	test('start http server to accept incoming requests', async (assert, done) => {
		await setupApplicationFiles()

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		/**
		 * Define routes
		 */
		const server = httpServer.application.container.use('Adonis/Core/Server')
		httpServer.application.container.use('Adonis/Core/Route').get('/', async () => 'handled')

		await httpServer.start((handler) => createServer(handler))
		assert.isTrue(httpServer.application.isReady)

		const { text } = await supertest(server.instance).get('/').expect(200)
		server.instance!.close()

		setTimeout(() => {
			assert.isFalse(httpServer.application.isReady)
			assert.equal(text, 'handled')
			done()
		}, 100)
	})

	test('forward errors to app error handler', async (assert, done) => {
		await setupApplicationFiles()

		await fs.add(
			'app/Exceptions/Handler.ts',
			`
	      export default class Handler {
	        async handle (error) {
	          return \`handled \${error.message}\`
	        }

	        report () {
	        }
	      }
	    `
		)

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		await httpServer.start((handler) => createServer(handler))
		const server = httpServer.application.container.use('Adonis/Core/Server')

		const { text } = await supertest(server.instance).get('/').expect(404)
		server.instance!.close(() => {
			done()
		})
		assert.equal(text, 'handled E_ROUTE_NOT_FOUND: Cannot GET:/')
	})

	test('kill app when server receives error', async (assert) => {
		assert.plan(1)

		await setupApplicationFiles()

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()
		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		httpServer.kill = async function kill() {
			assert.isTrue(true)
			server.instance!.close()
		}

		await httpServer.start((handler) => createServer(handler))
		const server = httpServer.application.container.use('Adonis/Core/Server')
		server.instance!.emit('error', new Error())
	})

	test('close http server gracefully when closing the app', async (assert, done) => {
		assert.plan(2)
		await setupApplicationFiles()

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		await httpServer.start((handler) => createServer(handler))
		const server = httpServer.application.container.use('Adonis/Core/Server')

		server.instance!.on('close', () => {
			assert.isTrue(true)
			assert.isFalse(httpServer.application.isReady)
			done()
		})

		await httpServer.close()
	})

	test('invoke shutdown method when gracefully closing the app', async (assert) => {
		await fs.add(
			'providers/AppProvider.ts',
			`
	    export default class AppProvider {
				constructor (protected $app) {}

				public static needsApplication = true

	      public async shutdown () {
	        this.$app.container.use('Adonis/Core/Server').hookCalled = true
	      }
	    }
	    `
		)

		await setupApplicationFiles(['./providers/AppProvider'])

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		await httpServer.start((handler) => createServer(handler))
		const server = httpServer.application.container.use('Adonis/Core/Server')

		await httpServer.close()
		assert.isTrue(server['hookCalled'])
	})
})

test.group('Ignitor | HTTP | Static Assets', (group) => {
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
		process.removeAllListeners('SIGINT')
		process.removeAllListeners('SIGTERM')

		delete process.env.NODE_ENV
		await fs.cleanup()
	})

	test('serve static files when static hooks is enabled', async (assert, done) => {
		await setupApplicationFiles()
		await fs.add(
			'config/static.ts',
			`
	      export const enabled = true
	    `
		)

		await fs.add('public/style.css', 'body { background: #000 }')

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		const server = httpServer.application.container.use('Adonis/Core/Server')
		await httpServer.start((handler) => createServer(handler))
		assert.isTrue(httpServer.application.isReady)

		const { text } = await supertest(server.instance).get('/style.css').expect(200)
		server.instance!.close()

		setTimeout(() => {
			assert.isFalse(httpServer.application.isReady)
			assert.equal(text, 'body { background: #000 }')
			done()
		}, 100)
	})

	test('serve static files from a custom public path', async (assert, done) => {
		await setupApplicationFiles()
		await fs.add(
			'config/static.ts',
			`
	      export const enabled = true
	    `
		)

		/**
		 * Overwriting .adonisrc.json
		 */
		const existingContent = await fs.get('.adonisrc.json')
		await fs.add(
			'.adonisrc.json',
			JSON.stringify(
				Object.assign(JSON.parse(existingContent), {
					directories: {
						public: 'www',
					},
				})
			)
		)

		await fs.add('www/style.css', 'body { background: #000 }')

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		const server = httpServer.application.container.use('Adonis/Core/Server')
		await httpServer.start((handler) => createServer(handler))

		assert.isTrue(httpServer.application.isReady)
		const { text } = await supertest(server.instance).get('/style.css').expect(200)
		server.instance!.close()

		setTimeout(() => {
			assert.isFalse(httpServer.application.isReady)
			assert.equal(text, 'body { background: #000 }')
			done()
		}, 100)
	})
})

test.group('Ignitor | HTTP | CORS', (group) => {
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
		process.removeAllListeners('SIGINT')
		process.removeAllListeners('SIGTERM')
		delete process.env.NODE_ENV
		await fs.cleanup()
	})

	test('respond to pre-flight requests when cors are enabled', async (assert, done) => {
		await setupApplicationFiles()
		await fs.add(
			'config/cors.ts',
			`
	      export const enabled = true
	      export const exposeHeaders = []
	      export const methods = ['GET']
	      export const origin = true
	      export const headers = true
	    `
		)

		const ignitor = new Ignitor(fs.basePath)
		const httpServer = ignitor.httpServer()

		httpServer.application.setup()
		httpServer.application.registerProviders()
		await httpServer.application.bootProviders()

		const server = httpServer.application.container.use('Adonis/Core/Server')
		await httpServer.start((handler) => createServer(handler))
		assert.isTrue(httpServer.application.isReady)

		const { header } = await supertest(server.instance)
			.options('/')
			.set('origin', 'foo.com')
			.set('Access-Control-Request-Method', 'GET')
			.expect(204)

		server.instance!.close()

		setTimeout(() => {
			assert.isFalse(httpServer.application.isReady)
			assert.equal(header['access-control-allow-origin'], 'foo.com')
			assert.equal(header['access-control-allow-methods'], 'GET')
			done()
		}, 100)
	})
})
