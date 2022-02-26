/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ServerContract } from '@ioc:Adonis/Core/Server'
import { CustomServerCallback } from '@ioc:Adonis/Core/TestUtils'

import { AppKernel } from '../Kernel'
import { createHttpServer } from '../../utils'

/**
 * Exposes the API to setup the application for starting the HTTP
 * server.
 *
 * - Calling "kill" explicitly exists the process.
 * - The "error" event emitted on the server instance explicitly exists the process.
 * - SIGINT and in some case SIGTERM explicitly exists the process.
 */
export class HttpServer {
  /**
   * Reference to the HTTP server.
   */
  private server: ServerContract

  /**
   * Reference to the app kernel
   */
  public kernel = new AppKernel(this.appRoot, 'web')
  public application = this.kernel.application

  constructor(private appRoot: string) {}

  /**
   * Closes the underlying HTTP server
   */
  private closeHttpServer(): Promise<void> {
    return new Promise((resolve) => this.server.instance!.close(() => resolve()))
  }

  /**
   * Monitors the HTTP server for close and error events, so that
   * we can perform a graceful shutdown.
   */
  private monitorHttpServer() {
    this.server.instance!.on('close', async () => {
      this.application.logger.trace('closing http server')
      this.server.instance!.removeAllListeners()
      this.application.isShuttingDown = true
    })

    this.server.instance!.on('error', async (error: NodeJS.ErrnoException) => {
      this.application.logger.error(error, error.message)
      await this.kill(3000)
    })
  }

  /**
   * Creates the HTTP server to handle incoming requests. The server is just
   * created but not listening on any port.
   */
  public createServer(serverCallback?: CustomServerCallback) {
    this.server = this.application.container.use('Adonis/Core/Server')
    createHttpServer(this.application, this.server, serverCallback)
  }

  /**
   * Starts the http server a given host and port
   */
  public listen(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.kernel.start(() => this.close())

        const host = this.application.env.get('HOST', '0.0.0.0')
        const port = Number(this.application.env.get('PORT', '3333'))

        this.server.instance!.listen(port, host, () => {
          this.application.logger.info('started server on %s:%s', host, port)
          this.kernel.ready({ port: port, host: host })
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
      await this.kernel.boot()
      this.createServer(serverCallback)
      this.monitorHttpServer()
      await this.listen()
    } catch (error) {
      await this.kernel.handleError(error)
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
    await this.kernel.close()
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
      await this.kernel.handleError(error).finally(() => process.exit(1))
    }
  }
}
