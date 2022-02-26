/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ServerContract } from '@ioc:Adonis/Core/Server'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { CustomServerCallback } from '@ioc:Adonis/Core/TestUtils'

import { createHttpServer } from '../../utils'

/**
 * The test HTTP server to handle and serve HTTP request
 */
export class TestHttpServer {
  private server: ServerContract

  constructor(public application: ApplicationContract) {}

  /**
   * Creates the HTTP server to handle incoming requests. The server is just
   * created but not listening on any port.
   */
  private create(serverCallback?: CustomServerCallback) {
    this.server = this.application.container.use('Adonis/Core/Server')
    createHttpServer(this.application, this.server, serverCallback)
  }

  /**
   * Start the HTTP server to listen for incoming requests
   */
  private listen() {
    const host = this.application.env.get('HOST', '0.0.0.0')
    const port = Number(this.application.env.get('PORT', '3333'))

    return new Promise<void>((resolve) => {
      this.server.instance!.listen(port, host, () => {
        this.application.logger.info('started server on %s:%s', host, port)
        resolve()
      })
    })
  }

  /**
   * Close HTTP server from listening to any requests
   */
  public close() {
    return new Promise<void>((resolve) => this.server.instance!.close(() => resolve()))
  }

  /**
   * Start the test HTTP server
   */
  public async start(serverCallback?: CustomServerCallback) {
    this.create(serverCallback)
    await this.listen()
    return () => this.close()
  }
}
