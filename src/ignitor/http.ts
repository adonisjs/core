/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Server as NodeHttpsServer } from 'node:https'
import {
  type IncomingMessage,
  type ServerResponse,
  type Server as NodeHttpServer,
  createServer,
} from 'node:http'

import debug from '../debug.ts'
import { type Ignitor } from './main.ts'
import type { ApplicationService, EmitterService, LoggerService } from '../types.ts'

/**
 * The HTTP server process is used to start the application in the
 * web environment. It creates and manages the Node.js HTTP server
 * instance, handling lifecycle events and monitoring.
 *
 * @example
 * const ignitor = new Ignitor()
 * const httpProcess = new HttpServerProcess(ignitor)
 * await httpProcess.start()
 */
export class HttpServerProcess {
  /**
   * Ignitor reference
   */
  #ignitor: Ignitor

  /**
   * Creates a new HTTP server process instance
   *
   * @param ignitor - The ignitor instance used to create and manage the app
   */
  constructor(ignitor: Ignitor) {
    this.#ignitor = ignitor
  }

  /**
   * Calling this method closes the underlying HTTP server gracefully.
   * 
   * @param nodeHttpServer - The Node.js HTTP or HTTPS server instance to close
   */
  #close(nodeHttpServer: NodeHttpsServer | NodeHttpServer): Promise<void> {
    return new Promise((resolve) => {
      debug('closing http server process')
      nodeHttpServer.close(() => resolve())
    })
  }

  /**
   * Monitors the app and the server to close the HTTP server when
   * either one of them goes down. Sets up event listeners for graceful shutdown.
   * 
   * @param nodeHttpServer - The Node.js HTTP or HTTPS server instance to monitor
   * @param app - The application service instance
   * @param logger - The logger service for error reporting
   */
  #monitorAppAndServer(
    nodeHttpServer: NodeHttpsServer | NodeHttpServer,
    app: ApplicationService,
    logger: LoggerService
  ) {
    /**
     * Close the HTTP server when the application begins to
     * terminate
     */
    app.terminating(async () => {
      debug('terminating signal received')
      await this.#close(nodeHttpServer)
    })

    /**
     * Terminate the app when the HTTP server crashes
     */
    nodeHttpServer.once('error', (error: NodeJS.ErrnoException) => {
      debug('http server crashed with error "%O"', error)
      logger.fatal({ err: error }, error.message)
      process.exitCode = 1
      app.terminate()
    })
  }

  /**
   * Starts the HTTP server on a given host and port using environment variables.
   * 
   * @param nodeHttpServer - The Node.js HTTP or HTTPS server instance to start listening
   */
  #listen(
    nodeHttpServer: NodeHttpsServer | NodeHttpServer
  ): Promise<{ port: number; host: string }> {
    return new Promise((resolve, reject) => {
      const host = process.env.HOST || '0.0.0.0'
      const port = Number(process.env.PORT || '3333')

      nodeHttpServer.listen(port, host)
      nodeHttpServer.once('listening', () => {
        debug('listening to http server, host :%s, port: %s', host, port)
        resolve({ port, host })
      })

      nodeHttpServer.once('error', (error: NodeJS.ErrnoException) => {
        reject(error)
      })
    })
  }

  /**
   * Notifies the app and the parent process that the HTTP server is ready.
   * Sends notifications through multiple channels: parent process, logger, and event emitter.
   * 
   * @param app - The application service instance for parent process notification
   * @param logger - The logger service for console output
   * @param emitter - The event emitter for app-level notifications
   * @param payload - Server startup information including host, port, and duration
   */
  #notifyServerHasStarted(
    app: ApplicationService,
    logger: LoggerService,
    emitter: EmitterService,
    payload: { host: string; port: number; duration: [number, number] }
  ) {
    /**
     * Notify parent process
     */
    app.notify({ isAdonisJS: true, environment: 'web', ...payload })

    /**
     * Visual notification
     */
    logger.info('started HTTP server on %s:%s', payload.host, payload.port)

    /**
     * Notify app
     */
    emitter.emit('http:server_ready', payload)
  }

  /**
   * Start the HTTP server by wiring up the application
   *
   * @param serverCallback - Optional callback to create custom HTTP server instance
   */
  async start(
    serverCallback?: (
      handler: (req: IncomingMessage, res: ServerResponse) => any
    ) => NodeHttpsServer | NodeHttpServer
  ) {
    const startTime = process.hrtime()

    /**
     * Method to create the HTTP server
     */
    const createHTTPServer = serverCallback || createServer
    const app = this.#ignitor.createApp('web')

    await app.init()
    await app.boot()
    await app.start(async () => {
      /**
       * Resolve and boot the AdonisJS HTTP server
       */
      const server = await app.container.make('server')
      await server.boot()

      /**
       * Create Node.js HTTP server instance and share it with the
       * AdonisJS HTTP server
       */
      const httpServer = createHTTPServer(server.handle.bind(server))
      server.setNodeServer(httpServer)

      const logger = await app.container.make('logger')
      const emitter = await app.container.make('emitter')

      /**
       * Start the server by listening on a port of host
       */
      const payload = await this.#listen(httpServer)

      /**
       * Notify
       */
      this.#notifyServerHasStarted(app, logger, emitter, {
        ...payload,
        duration: process.hrtime(startTime),
      })

      /**
       * Monitor app and the server (after the server is listening)
       */
      this.#monitorAppAndServer(httpServer, app, logger)
    })
  }
}
