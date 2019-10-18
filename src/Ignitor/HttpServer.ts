/*
 * @adonisjs/ace
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Hooks } from '@poppinss/hooks'
import { Server as HttpsServer } from 'https'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { ServerContract } from '@ioc:Adonis/Core/Server'
import { IncomingMessage, ServerResponse, Server, createServer } from 'http'
import { Ignitor } from './index'

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

/**
 * Exposes the API to start/close the HTTP server.
 */
export class HttpServer {
  /**
   * Reference to core http server
   */
  private _server = this._ignitor.application.container.use<ServerContract>('Adonis/Core/Server')

  /**
   * Reference to core logger
   */
  private _logger = this._ignitor.application.container.use<LoggerContract>('Adonis/Core/Logger')

  /**
   * Namespace reference to handle HTTP exceptions
   */
  private _exceptionHandlerNamespace = this._ignitor.application.exceptionHandlerNamespace

  private _hooks = new Hooks()

  constructor (private _ignitor: Ignitor, serverCallback?: CustomServerCallback) {
    this._createServer(serverCallback)
  }

  /**
   * Creates the HTTP server to handle incoming requests. The server is just
   * created but not listening on any port.
   */
  private _createServer (serverCallback?: CustomServerCallback) {
    /**
     * Optimizing the server by pre-compiling routes and middleware
     */
    this._logger.trace('optimizing http server handler')
    this._server.optimize()

    /**
     * Bind exception handler to handle exceptions occured during HTTP
     * requests.
     */
    this._logger.trace('binding %s exception handler', this._exceptionHandlerNamespace)
    this._server.errorHandler(this._exceptionHandlerNamespace)

    const handler = this._server.handle.bind(this._server)
    this._server.instance = serverCallback ? serverCallback(handler) : createServer(handler)
  }

  /**
   * Starts the http server a given host and port
   */
  private _listen () {
    return new Promise((resolve) => {
      const Env = this._ignitor.application.container.use('Adonis/Core/Env')
      const host = Env.get('HOST', '0.0.0.0') as string
      const port = Number(Env.get('PORT', '3333') as string)

      this._server.instance!.listen(port, host, () => {
        this._logger.info('started server on %s:%s', host, port)
        resolve()
      })
    })
  }

  /**
   * Monitors the HTTP server for close and error events, so that
   * we can perform a graceful shutdown
   */
  private _monitorHttpServer () {
    if (!this._server.instance) {
      return
    }

    this._server.instance.on('close', async () => {
      await this._hooks.exec('after', 'close')
      this._logger.trace('closing http server')
      this._server.instance!.removeAllListeners()
    })

    this._server.instance.on('error', async (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        this._server.instance!.close()
        return
      }

      await this._hooks.exec('after', 'error')
    })
  }

  /**
   * Register before hook
   */
  public before (event: 'start', handler: () => any): this {
    this._hooks.add('before', event, handler)
    return this
  }

  /**
   * Register after hook
   */
  public after (event: 'start' | 'close' | 'error', handler: () => any): this {
    this._hooks.add('after', event, handler)
    return this
  }

  /**
   * Start the HTTP server to listen for new requests
   */
  public async start () {
    await this._hooks.exec('before', 'start')
    await this._listen()
    await this._hooks.exec('after', 'start')
    await this._monitorHttpServer()
  }

  /**
   * Closes the underlying HTTP server.
   */
  public close () {
    this._server.instance!.close()
  }
}
