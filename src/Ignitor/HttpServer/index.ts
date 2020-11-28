/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Server as HttpsServer } from 'https'
import { Application } from '@adonisjs/application'
import { ServerContract } from '@ioc:Adonis/Core/Server'
import { IncomingMessage, ServerResponse, Server, createServer } from 'http'

import { ErrorHandler } from './ErrorHandler'
import { SignalsListener } from '../SignalsListener'

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

/**
 * Exposes the API to setup the application for starting the HTTP
 * server.
 */
export class HttpServer {
	/**
	 * Reference to core http server.
	 */
	private server: ServerContract

	/**
	 * Whether or not the application has been wired.
	 */
	private wired: boolean = false

	/**
	 * Reference to the application.
	 */
	public application = new Application(this.appRoot, 'web')

	/**
	 * Listens for unix signals to kill long running
	 * processes.
	 */
	private signalsListener = new SignalsListener(this.application)

	constructor(private appRoot: string) {}

	/**
	 * Wires up everything, so that we are ready to kick start
	 * the HTTP server.
	 */
	private async wire() {
		if (this.wired) {
			return
		}

		/**
		 * Setting up the application.
		 */
		this.application.setup()

		/**
		 * Registering providers
		 */
		this.application.registerProviders()

		/**
		 * Booting providers
		 */
		await this.application.bootProviders()

		/**
		 * Importing preloaded files
		 */
		this.application.requirePreloads()
	}

	/**
	 * Sets the server reference
	 */
	private setServer() {
		this.server = this.application.container.use('Adonis/Core/Server')
	}

	/**
	 * Closes the underlying HTTP server
	 */
	private closeHttpServer(): Promise<void> {
		return new Promise((resolve) => this.server.instance!.close(() => resolve()))
	}

	/**
	 * Monitors the HTTP server for close and error events, so that
	 * we can perform a graceful shutdown
	 */
	private monitorHttpServer() {
		this.server.instance!.on('close', async () => {
			this.application.logger.trace('closing http server')
			this.server.instance!.removeAllListeners()
			this.application.isShuttingDown = true
		})

		this.server.instance!.on('error', async (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') {
				this.application.logger.error('Port in use, closing server')
				process.exitCode = 1
				return
			}

			await this.kill(3000)
		})
	}

	/**
	 * Notify server is ready
	 */
	private notifyServerReady(host: string, port: number) {
		this.application.logger.info('started server on %s:%s', host, port)

		if (process.send) {
			process.send({ origin: 'adonis-http-server', ready: true, port: port, host: host })
		}
	}

	/**
	 * Creates the HTTP server to handle incoming requests. The server is just
	 * created but not listening on any port.
	 */
	public createServer(serverCallback?: CustomServerCallback) {
		/**
		 * Optimizing the server by pre-compiling routes and middleware
		 */
		this.application.logger.trace('optimizing http server handler')
		this.server.optimize()

		/**
		 * Bind exception handler to handle exceptions occured during HTTP requests.
		 */
		if (this.application.exceptionHandlerNamespace) {
			this.application.logger.trace(
				'binding %s exception handler',
				this.application.exceptionHandlerNamespace
			)
			this.server.errorHandler(this.application.exceptionHandlerNamespace)
		}

		const handler = this.server.handle.bind(this.server)
		this.server.instance = serverCallback ? serverCallback(handler) : createServer(handler)
	}

	/**
	 * Starts the http server a given host and port
	 */
	public listen(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			try {
				await this.application.start()

				const host = this.application.env.get('HOST', '0.0.0.0')
				const port = Number(this.application.env.get('PORT', '3333'))

				this.server.instance!.listen(port, host, () => {
					this.notifyServerReady(host, port)
					resolve()
				})
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Start the HTTP server by wiring up the application
	 */
	public async start(serverCallback?: CustomServerCallback) {
		try {
			await this.wire()
			this.setServer()
			this.createServer(serverCallback)
			this.monitorHttpServer()
			await this.listen()
			this.signalsListener.listen(() => this.close())
		} catch (error) {
			await new ErrorHandler(this.application).handleError(error)
		}
	}

	/**
	 * Prepares the application for shutdown. This method will invoke `shutdown`
	 * lifecycle method on the providers and closes the `httpServer`.
	 */
	public async close() {
		/**
		 * Close the HTTP server before excuting the `shutdown` hooks. This ensures that
		 * we are not accepting any new request during cool off.
		 */
		await this.closeHttpServer()
		this.signalsListener.cleanup()
		await this.application.shutdown()
	}

	/**
	 * Kills the http server process by attempting to perform a graceful
	 * shutdown or killing the app forcefully as waiting for configured
	 * seconds.
	 */
	public async kill(waitTimeout: number = 3000) {
		this.application.logger.trace('forcefully killing http server')

		try {
			await Promise.race([
				this.close(),
				new Promise((resolve) => {
					setTimeout(resolve, waitTimeout)
				}),
			])
			process.exit(0)
		} catch (error) {
			new ErrorHandler(this.application).handleError(error).finally(() => process.exit(1))
		}
	}
}
