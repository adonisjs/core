/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Server as NodeHttpsServer } from 'node:https'
import { IncomingMessage, ServerResponse, Server as NodeHttpServer, createServer } from 'node:http'

import debug from '../debug.js'
import type { ApplicationService, EmitterService, LoggerService } from '../types.js'

/**
 * The HTTP server process is used to start the application in the
 * web environment.
 */
export class HttpServerProcess {
  /**
   * Access to the currently running application
   */
  #application: ApplicationService

  /**
   * Reference to the underlying HTTP server
   */
  #nodeHttpServer?: NodeHttpsServer | NodeHttpServer

  constructor(application: ApplicationService) {
    this.#application = application
  }

  /**
   * Monitors the app and the server to close the HTTP server when
   * either one of them goes down
   */
  #monitorAppAndServer(logger: LoggerService) {
    if (!this.#nodeHttpServer) {
      return
    }

    /**
     * Close the HTTP server when the application begins to
     * terminate
     */
    this.#application.terminating(async () => {
      debug('terminating signal received')
      await this.close()
    })

    /**
     * Terminate the app when the HTTP server crashes
     */
    this.#nodeHttpServer.on('error', (error: NodeJS.ErrnoException) => {
      debug('http server crashed with error "%O"', error)
      logger.fatal({ err: error }, error.message)
      this.#application.terminate()
    })
  }

  /**
   * Starts the http server a given host and port
   */
  #listen(logger: LoggerService, emitter: EmitterService): Promise<void> {
    return new Promise((resolve) => {
      if (!this.#nodeHttpServer) {
        return resolve()
      }

      const host = process.env.HOST || '0.0.0.0'
      const port = Number(process.env.PORT || '3333')

      this.#nodeHttpServer.listen(port, host, () => {
        /**
         * Visual notification
         */
        logger.info('started HTTP server on %s:%s', host, port)

        /**
         * Notify parent process
         */
        this.#application.notify({ isAdonisJS: true, port: port, host: host })

        /**
         * Notify app
         */
        emitter.emit('http:server_ready', { port: port, host: host })

        resolve()
      })
    })
  }

  /**
   * Start the HTTP server by wiring up the application
   */
  async start(
    serverCallback?: (
      handler: (req: IncomingMessage, res: ServerResponse) => any
    ) => NodeHttpsServer | NodeHttpServer
  ) {
    /**
     * Method to create the HTTP server
     */
    const createHTTPServer = serverCallback || createServer

    /**
     * Initiate the app
     */
    await this.#application.init()

    /**
     * Boot the application
     */
    await this.#application.boot()

    /**
     * Start application by starting the HTTP server
     */
    await this.#application.start(async () => {
      const server = await this.#application.container.make('server')
      const logger = await this.#application.container.make('logger')
      const emitter = await this.#application.container.make('emitter')

      await server.boot()

      this.#nodeHttpServer = createHTTPServer(server.handle.bind(server))
      server.setNodeServer(this.#nodeHttpServer)

      await this.#listen(logger, emitter)
      this.#monitorAppAndServer(logger)
    })
  }

  /**
   * Calling this method closes the underlying HTTP server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.#nodeHttpServer) {
        return resolve()
      }

      debug('close http server process')
      this.#nodeHttpServer.close(() => resolve())
    })
  }
}
