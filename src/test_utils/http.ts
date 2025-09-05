/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import debug from '../debug.ts'
import type { TestUtils } from './main.ts'
import type { Server as NodeHttpsServer } from 'node:https'
import {
  type IncomingMessage,
  type ServerResponse,
  type Server as NodeHttpServer,
  createServer,
} from 'node:http'

/**
 * Http server utils are used to start the AdonisJS HTTP server
 * during testing. It provides methods to start and stop the server
 * for integration testing.
 *
 * @example
 * const testUtils = new TestUtils(app)
 * const httpUtils = testUtils.httpServer()
 *
 * const closeServer = await httpUtils.start()
 * // Make HTTP requests to test endpoints
 * await closeServer() // Clean up
 */
export class HttpServerUtils {
  /**
   * Reference to the test utils instance
   */
  #utils: TestUtils

  /**
   * Creates a new HttpServerUtils instance
   *
   * @param utils - The test utils instance
   */
  constructor(utils: TestUtils) {
    this.#utils = utils
  }

  /**
   * Starts the http server a given host and port
   *
   * @param nodeHttpServer - The Node.js HTTP server instance
   */
  #listen(
    nodeHttpServer: NodeHttpsServer | NodeHttpServer
  ): Promise<{ port: number; host: string }> {
    return new Promise((resolve, reject) => {
      const host = process.env.HOST || '0.0.0.0'
      const port = Number(process.env.PORT || '3333')

      nodeHttpServer.listen(port, host)
      nodeHttpServer.once('listening', () => {
        debug('listening to utils http server, host :%s, port: %s', host, port)
        resolve({ port, host })
      })

      nodeHttpServer.once('error', (error: NodeJS.ErrnoException) => {
        reject(error)
      })
    })
  }

  /**
   * Testing hook to start the HTTP server to listen for new request.
   * The return value is a function to close the HTTP server.
   *
   * @param serverCallback - Optional callback to create custom HTTP server instance
   */
  async start(
    serverCallback?: (
      handler: (req: IncomingMessage, res: ServerResponse) => any
    ) => NodeHttpsServer | NodeHttpServer
  ): Promise<() => Promise<void>> {
    const createHTTPServer = serverCallback || createServer

    const server = await this.#utils.app.container.make('server')
    await server.boot()

    const httpServer = createHTTPServer(server.handle.bind(server))
    server.setNodeServer(httpServer)

    await this.#listen(httpServer)

    return () => {
      return new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    }
  }
}
