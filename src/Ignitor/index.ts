/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Server as HttpsServer } from 'https'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { IncomingMessage, ServerResponse, Server } from 'http'

import { Ace } from './Ace'
import { HttpServer } from './HttpServer'
import { ErrorHandler } from './ErrorHandler'
import { Bootstrapper } from './Bootstrapper'

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

/**
 * Ignitor is used to wireup different pieces of AdonisJs to bootstrap
 * the application.
 */
export class Ignitor {
  /**
   * An array of provider instances, that has `ready` hook. We
   * need a reference of these providers until app is ready
   * and then we clean off this array.
   */
  private _providersWithReadyHook: any[] = []

  /**
   * An array of provider instances, that has `shutdown` hook. We
   * need a reference of those providers through out the app
   * lifecycle, so that we call `shutdown` hook when server
   * stops.
   */
  private _providersWithShutdownHook: any[] = []

  /**
   * Reference to the commands defined on providers
   */
  private _providersCommands: string[] = []

  /**
   * Reference to the boostrapper to bootstrap the application
   */
  private _bootstrapper = new Bootstrapper(this._appRoot)

  /**
   * Handles errors occurred during the bootstrap process
   */
  private _errorHandler: ErrorHandler

  /**
   * Note on Ignitor processes.
   *
   * Ignitor currently supports starting `ace` and `http server` processes
   * and holds a reference to them to close/cleanup during graceful
   * exists
   */
  /**
   * Reference to the HTTP server process, so that we can clean it
   * before gracefully shutting down the app.
   */
  private _httpServer: HttpServer

  /**
   * Reference to the application instance
   */
  public application = this._bootstrapper.setup()

  /**
   * Tracking if application has already been bootstrapped
   * or not.
   */
  public bootstraped: boolean = false

  /**
   * Tracking if providers have been booted or not
   */
  public providersBooted: boolean = false

  constructor (private _appRoot: string) {
    this._errorHandler = new ErrorHandler(this.application)
  }

  /**
   * Exit process conditionally
   */
  private _exitProcess (signal) {
    if (process.env.NODE_ENV === 'testing') {
      return
    }
    process.exit(signal)
  }

  /**
   * Executes the ready hooks when the application is ready.
   *
   * - In case of HTTP server it is called just before calling the `listen` method.
   * - In case of Ace commands it is called just before executing the command, only if
   *   commands relies on the application.
   */
  private async _executeReadyHooks () {
    await Promise.all(this._providersWithReadyHook.map((provider) => provider.ready()))
  }

  /**
   * Prepares the application for shutdown. This method will invoke `shutdown`
   * lifecycle method on the providers and closes the `httpServer` if
   * ignitor process is started to server http requests.
   */
  private async _prepareShutDown () {
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')
    this.application.isShuttingDown = true

    /**
     * Close the HTTP server before excuting the `shutdown` hooks. This ensures that
     * we are not accepting any new request during cool off.
     */
    if (this._httpServer) {
      await this._httpServer.close()
    }

    logger.trace('preparing server shutdown')
    await Promise.all(this._providersWithShutdownHook.map((provider) => provider.shutdown()))
  }

  /**
   * Bind listeners for `SIGINT` and `SIGTERM` signals. The `SIGINT`
   * signal is only handled when process is started using pm2.
   */
  private _listenForExitEvents () {
    /**
     * Only when starting using pm2, otherwise only `Ctrl+C` sends
     * SIGINT signal, which doesn't need graceful exit.
     */
    if (process.env.pm_id) {
      process.on('SIGINT', async () => {
        try {
          await this.close()
          this._exitProcess(0)
        } catch (error) {
          this._exitProcess(1)
        }
      })
    }

    process.on('SIGTERM', async () => {
      try {
        await this.close()
        this._exitProcess(0)
      } catch (error) {
        this._exitProcess(1)
      }
    })
  }

  /**
   * Bootstrap the application by register and booting all
   * providers, setting up autoloads and preloading files.
   */
  public async bootstrap (deferBootingProviders: boolean = false) {
    if (this.bootstraped) {
      return
    }

    this.bootstraped = true

    /**
     * Keep a reference of `ready` and `shutdown` providers, so that we can
     * invoke lifecycle methods later
     */
    this._bootstrapper
      .registerProviders(this.application.environment === 'console')
      .forEach((provider) => {
        if (typeof (provider.ready) === 'function') {
          this._providersWithReadyHook.push(provider)
        }

        if (typeof (provider.shutdown) === 'function') {
          this._providersWithShutdownHook.push(provider)
        }

        if (Array.isArray(provider.commands)) {
          this._providersCommands = this._providersCommands.concat(provider.commands)
        }
      })

    this._bootstrapper.registerAutoloads()

    /**
     * Boot providers when not deferring the bootstrap process
     */
    if (!deferBootingProviders) {
      await this.bootProviders()
    }

    this._bootstrapper.registerPreloads()
  }

  /**
   * Register and boot all application providers. Also defines the aliases
   * for IoC container bindings.
   */
  public async bootProviders () {
    if (this.providersBooted) {
      return
    }

    this.providersBooted = true
    await this._bootstrapper.bootProviders()
  }

  /**
   * Bootstrap the application and start HTTP server to accept
   * new connections.
   */
  public async startHttpServer (serverCallback?: CustomServerCallback) {
    this.application.environment = 'web'

    try {
      await this.bootstrap(false)
      this._httpServer = new HttpServer(this, serverCallback)

      /**
       * Execute ready hooks before we are ready to start the server
       */
      this._httpServer.before('start', () => this._executeReadyHooks())

      /**
       * Update app ready status to true, when server is ready for incoming
       * requests
       */
      this._httpServer.after('start', () => {
        this.application.isReady = true
        this._listenForExitEvents()
      })

      /**
       * Kill the app, when server recieves error. Server will be
       * unusable after this
       */
      this._httpServer.after('error', () => this.kill(3000))

      /**
       * Update app ready status to false, since server cannot accept new
       * requests
       */
      this._httpServer.after('close', () => this.application.isReady = false)

      await this._httpServer.start()
    } catch (error) {
      await this._errorHandler.handleError(error)
      this._exitProcess(1)
    }
  }

  /**
   * Handle the ace command. Since ace commands doesn't have any graceful
   * shutdown processs, we can only perform graceful shutdowns for
   * long living ace command processes killed using signals.
   */
  public async handleAceCommand (argv: string[]) {
    this.application.environment = 'console'
    const ace = new Ace(this)

    ace.before('start', () => this._executeReadyHooks())

    ace.after('start', () => {
      this.application.isReady = true
      this._listenForExitEvents()
    })

    await ace.handle(argv)
  }

  /**
   * Closes the ignitor process. This will perform a graceful
   * shutdown.
   */
  public async close () {
    await this._prepareShutDown()
  }

  /**
   * Kills the ignitor process by attempting to perform a graceful
   * shutdown or killing the app forcefully as waiting for configured
   * seconds.
   */
  public async kill (waitTimeout: number = 3000) {
    try {
      await Promise.race([this._prepareShutDown(), new Promise((resolve) => {
        setTimeout(resolve, waitTimeout)
      })])
      this._exitProcess(0)
    } catch (error) {
      await this._errorHandler.handleError(error)
      this._exitProcess(1)
    }
  }
}
