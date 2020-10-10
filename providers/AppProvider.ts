/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * The application provider that sticks all core components
 * to the container.
 */
export default class AppProvider {
	constructor(protected app: ApplicationContract) {}
	public static needsApplication = true

	/**
	 * Additional providers to load
	 */
	public provides = [
		'@adonisjs/encryption',
		'@adonisjs/events',
		'@adonisjs/hash',
		'@adonisjs/http-server',
		'@adonisjs/bodyparser',
		'@adonisjs/validator',
	]

	/**
	 * Register `HttpExceptionHandler` to the container.
	 */
	protected registerHttpExceptionHandler() {
		this.app.container.bind('Adonis/Core/HttpExceptionHandler', () => {
			const { HttpExceptionHandler } = require('../src/HttpExceptionHandler')
			return HttpExceptionHandler
		})
	}

	/**
	 * Registering the health check provider
	 */
	protected registerHealthCheck() {
		this.app.container.singleton('Adonis/Core/HealthCheck', () => {
			const { HealthCheck } = require('../src/HealthCheck')
			return new HealthCheck(this.app)
		})
	}

	/**
	 * Lazy initialize the cors hook, if enabled inside the config
	 */
	protected registerCorsHook() {
		/**
		 * Register the cors before hook with the server
		 */
		this.app.container.with(['Adonis/Core/Config', 'Adonis/Core/Server'], (Config, Server) => {
			const config = Config.get('cors', {})
			if (!config.enabled) {
				return
			}

			const Cors = require('../src/Hooks/Cors').Cors
			const cors = new Cors(config)
			Server.hooks.before(cors.handle.bind(cors))
		})
	}

	/**
	 * Lazy initialize the static assets hook, if enabled inside the config
	 */
	protected registerStaticAssetsHook() {
		/**
		 * Register the cors before hook with the server
		 */
		this.app.container.with(
			['Adonis/Core/Config', 'Adonis/Core/Server', 'Adonis/Core/Application'],
			(Config, Server, Application) => {
				const config = Config.get('static', {})
				if (!config.enabled) {
					return
				}

				const ServeStatic = require('../src/Hooks/Static').ServeStatic
				const serveStatic = new ServeStatic(Application.publicPath(), config)
				Server.hooks.before(serveStatic.handle.bind(serveStatic))
			}
		)
	}

	/**
	 * Registers base health checkers
	 */
	protected registerHealthCheckers() {
		this.app.container.with(['Adonis/Core/HealthCheck'], (healthCheck) => {
			require('../src/HealthCheck/Checkers/Env').default(healthCheck)
			require('../src/HealthCheck/Checkers/AppKey').default(healthCheck)
		})
	}

	/**
	 * Registering all required bindings to the container
	 */
	public register() {
		this.registerHttpExceptionHandler()
		this.registerHealthCheck()
	}

	/**
	 * Register hooks and health checkers on boot
	 */
	public boot() {
		this.registerCorsHook()
		this.registerStaticAssetsHook()
		this.registerHealthCheckers()
	}
}
