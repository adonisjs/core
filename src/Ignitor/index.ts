/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import { Server as HttpsServer } from 'https'
import { Ioc, Registrar } from '@adonisjs/fold'
import { esmRequire, Exception } from '@poppinss/utils'
import { ServerContract, HttpContext } from '@poppinss/http-server'
import { Application, ApplicationContract } from '@poppinss/application'
import { IncomingMessage, ServerResponse, Server, createServer } from 'http'
import { useReturnValue } from '@poppinss/http-server/build/src/Server/useReturnValue'
import * as findPkg from 'find-package-json'

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

/**
 * Ignitor is used to wireup different pieces of AdonisJs to bootstrap
 * the application.
 */
export class Ignitor {
  public application: ApplicationContract

  /**
   * Reference to provider class instances. We need to keep
   * a reference to execute lifecycle hooks during the
   * startup process.
   */
  private _providersList: any[] = []

  /**
   * An array of provider instances, that has `onExit` hook. We
   * need a reference of those providers through out the
   * app lifecycle, so that we call `onExit` hook when
   * server stops.
   */
  private _providersWithExitHook: any[] = []

  /**
   * Tracking if application has already been bootstrapped
   * or not.
   */
  private _bootstraped: boolean

  constructor (private _appRoot: string) {
    const ioc = new Ioc()

    /**
     * Adding IoC container resolver methods to the globals.
     */
    global[Symbol.for('ioc.use')] = ioc.use.bind(ioc)
    global[Symbol.for('ioc.make')] = ioc.make.bind(ioc)
    global[Symbol.for('ioc.call')] = ioc.call.bind(ioc)
    global[Symbol.for('ioc.useEsm')] = ioc.useEsm.bind(ioc)

    /**
     * The package file is required to read the version of `@adonisjs/core`
     * package and set that as the application version
     */
    const nearestDir = join(__dirname, '..', '..')
    const pkgVersion = findPkg(nearestDir).next().value.version

    /**
     * The contents of the rc file
     */
    const rcContents = this._require(join(this._appRoot, '.adonisrc.json'), true) || {}

    /**
     * Setting up the application
     */
    this.application = new Application(this._appRoot, ioc, rcContents, pkgVersion)

    /**
     * For now we hardcode the envirnonment to web. Later this will change after
     * the introduction of `console` and `test` bootstrappers within ignitor.
     */
    this.application.environment = 'web'
  }

  /**
   * Require a module and optionally ignore error if file is missing
   */
  private _require (filePath: string, optional = false): any | null {
    try {
      return esmRequire(filePath)
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].indexOf(error.code) > -1 && optional) {
        return null
      }

      throw error
    }
  }

  /**
   * Returns `providers` and `aliases` from the app file.
   */
  private _requireAppFile (): { providers: string[], aliases: { [key: string]: string } } {
    const appExports = require(this.application.startPath('app'))

    /**
     * Validate the required props to ensure they exists
     */
    const requiredExports = ['providers']
    requiredExports.forEach((prop) => {
      if (!appExports[prop]) {
        throw new Exception(
          `export \`${prop}\` from \`${this.application.directoriesMap.get('start')}/app\` file`,
          500,
          'E_MISSING_APP_ESSENTIALS',
        )
      }
    })

    return {
      providers: appExports.providers,
      aliases: appExports.aliases || {},
    }
  }

  /**
   * Register and boot all application providers. Also defines the aliases
   * for IoC container bindings.
   */
  private async _bootProviders () {
    const registrar = new Registrar(this.application.container)

    /**
     * Loads `start/app` file and use providers and aliases from it. In
     * case of `intent === ace`, also use `aceProviders`.
     */
    const { providers, aliases } = this._requireAppFile()

    /**
     * Register all providers
     */
    this._providersList = registrar.useProviders(providers).register()

    /**
     * We need to persist the providers with `exit` hook, so that we can
     * call them, when application goes down.
     */
    this._providersWithExitHook = this._providersList.filter((provider) => {
      return typeof (provider.onExit) === 'function'
    })

    /**
     * Register aliases after registering providers. This will override
     * the aliases defined by the providers, since user defined aliases
     * are given more preference.
     */
    Object.keys(aliases).forEach((alias) => {
      this.application.container.alias(aliases[alias], alias)
    })

    /**
     * Finally boot providers, which is an async process.
     */
    await registrar.boot(this._providersList)
  }

  /**
   * Register autoloads
   */
  private _registerAutoloads () {
    this.application.autoloadsMap.forEach((toPath, alias) => {
      this.application.container.autoload(join(this.application.appRoot, toPath), alias)
    })
  }

  /**
   * Preloads all files defined inside `.adonisrc.json` file.
   */
  private _preloadFiles () {
    this.application.preloads
      .filter((node) => {
        if (!node.environment) {
          return true
        }

        if (this.application.environment === 'unknown') {
          return true
        }

        return node.environment.indexOf(this.application.environment) > -1
      })
      .forEach((node) => {
        this._require(join(this.application.appRoot, node.file), node.optional)
      })
  }

  /**
   * Binds exception handler when it's namespace is
   * defined
   */
  private _bindExceptionHandler (server: ServerContract<HttpContext>) {
    const handlerInstance = this.application.container.make(this.application.exceptionHandlerNamespace)

    /**
     * Attaching a custom callback to the server to forward
     * errors to the App exception handler
     */
    server.onError(async (error, ctx) => {
      handlerInstance.report(error, ctx)
      const response = await handlerInstance.handle(error, ctx)

      if (useReturnValue(response, ctx)) {
        ctx.response.safeStatus(error.status || 500)
        ctx.response.send(response)
      }
    })
  }

  /**
   * Start the HTTP server by pulling it from the IoC container
   */
  private async _createHttpServer (serverCallback?: CustomServerCallback) {
    const server = this.application.container.use('Adonis/Core/Server')
    const router = this.application.container.use('Adonis/Core/Route')

    /**
     * Commit routes to the router store
     */
    router.commit()

    /**
     * Optimize server to cache handler
     */
    server.optimize()

    /**
     * Handled exceptions during the HTTP request/response
     * lifecycle
     */
    this._bindExceptionHandler(server)

    /**
     * Finally start the HTTP server and keep reference to
     * it
     */
    const handler = server.handle.bind(server)

    /**
     * Set Http or Https server as an instance on Adonis server
     */
    server.instance = serverCallback ? serverCallback(handler) : createServer(handler)

    /**
     * Pull providers with HTTP server hook
     */
    const providersWithHttpHook = this._providersList.filter((provider) => {
      return typeof (provider.onHttpServer) === 'function'
    })

    /**
     * Execute hooks
     */
    await Promise.all(providersWithHttpHook.map((provider) => provider.onHttpServer()))
  }

  /**
   * Attach http server to a given port and host by picking it from
   * the `environment` variables.
   */
  private _listen () {
    return new Promise((resolve) => {
      const Env = this.application.container.use('Adonis/Core/Env')
      const Logger = this.application.container.use('Adonis/Core/Logger')
      const Server = this.application.container.use('Adonis/Core/Server')
      const host = Env.get('HOST', '0.0.0.0') as string
      const port = Number(Env.get('PORT', '3333') as string)

      Server.instance!.listen(port, host, () => {
        Logger.info('started server on %s:%s', host, port)
        resolve()
      })
    })
  }

  /**
   * Closes HTTP server and then executes all `onExit` hooks
   * before exiting the process.
   *
   * The HTTP is closed first, so that other unavailable resources
   * will not impact existing requests.
   */
  private _onExit () {
    const Server = this.application.container.use('Adonis/Core/Server')

    Server.instance!.close(async (error: any) => {
      if (error) {
        process.exit(1)
      }

      try {
        await Promise.all(this._providersWithExitHook.map((provider: any) => provider.onExit()))
        process.exit(0)
      } catch (error) {
        process.exit(1)
      }
    })
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
      process.on('SIGINT', this._onExit.bind(this))
    }

    process.on('SIGTERM', this._onExit.bind(this))
  }

  /**
   * Pretty prints the error on terminal
   */
  private async _prettyPrintError (error: any) {
    const Youch = require('youch')
    const output = await new Youch(error, {}).toJSON()
    console.log(require('youch-terminal')(output))
    process.exit(1)
  }

  /**
   * Bootstrap the application by register and booting all
   * providers, setting up autoloads and preloading files.
   */
  public async bootstrap () {
    if (this._bootstraped) {
      return
    }

    this._bootstraped = true
    await this._bootProviders()
    this._registerAutoloads()
    this._preloadFiles()
  }

  /**
   * Bootstrap the application and start HTTP server to accept
   * new connections.
   */
  public async startHttpServer (serverCallback?: CustomServerCallback) {
    try {
      await this.bootstrap()
      await this._createHttpServer(serverCallback)
      await this._listen()
      await this._listenForExitEvents()
    } catch (error) {
      this._prettyPrintError(error)
    }
  }
}
