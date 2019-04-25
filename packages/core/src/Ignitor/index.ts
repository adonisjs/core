/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { merge } from 'lodash'
import { createServer } from 'http'
import { Exception, tsRequire } from '@adonisjs/utils'
import { ServerContract, useReturnValue } from '@adonisjs/server'
import { Registrar, Ioc } from '@adonisjs/fold'
import { Profiler, ProfilerRowContract, ProfilerSubscriber } from '@adonisjs/profiler'

import { Helpers } from '../Helpers'
import { exceptionCodes } from '../../lib'
import { RcFileNode, PreloadNode } from '../Contracts/Ignitor'

/**
 * Defaults when file is missing or incomplete
 */
const DEFAULTS: RcFileNode = {
  typescript: false,
  autoloads: {
    App: './app',
  },
  preloads: [],
  directories: {
    config: './config',
    public: './public',
    database: './database',
    migrations: './database/migrations',
    seeds: './database/seeds',
    resources: './resources',
    views: './resources/views',
    tmp: './tmp',
    start: './start',
  },
}

export class Ignitor {
  /**
   * Directories defined inside `.adonisrc.json`
   */
  public directories: { [identifier: string]: string }

  /**
   * Autoloads defined inside `.adonisrc.json`
   */
  public autoloads: { [alias: string]: string }

  /**
   * Telling if the project is compiled using Typescript or not
   */
  public typescript: boolean

  /**
   * Reference to the IoC container.
   */
  public ioc: Ioc

  /**
   * An array of files to be preloaded after providers have been
   * booted
   */
  public preloads: PreloadNode[]

  /**
   * Reference to HTTP server
   */
  public server: any

  /**
   * Intent must be defined, since it tells ignitor how
   * to bootstrap the app
   */
  private _intent: string

  /**
   * Profiler row instance to profile actions under
   * bootstrap row
   */
  private _bootstrapper: ProfilerRowContract | null

  /**
   * Application wide subscriber for collecting profiler
   * data
   */
  private _profilerSubscriber: ProfilerSubscriber

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
   * Reference to the exception handler namespace, defined
   * inside `.adonisrc.json` file.
   */
  private _exceptionHandlerNamespace?: string

  constructor (public appRoot: string) {}

  /**
   * Require a module and optionally ignore error if file is missing
   */
  private _require (filePath: string, optional = false): any | null {
    try {
      return tsRequire(filePath)
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].indexOf(error.code) > -1 && optional) {
        return null
      }

      throw error
    }
  }

  /**
   * Load `.adonisrc.json` file from the project root. Only `directories` will be merged
   * and everything else will overwrite the defaults.
   */
  private _loadRcFile () {
    const rcFile: RcFileNode = this._require(join(this.appRoot, '.adonisrc.json'), true) || {}

    /**
     * Only directories are supposed to be merged
     */
    this.directories = merge({}, DEFAULTS.directories, rcFile.directories)

    /**
     * Use rc autoloads or use defaults. Autoloads cannot get
     * merged, since different object keys can point to a
     * single directory
     */
    this.autoloads = rcFile.autoloads || DEFAULTS.autoloads

    /**
     * Use rc `typescript` flag or fallback to DEFAULTS
     */
    this.typescript = rcFile.typescript || DEFAULTS.typescript

    /**
     * Update reference
     */
    this._exceptionHandlerNamespace = rcFile.exceptionHandlerNamespace

    /**
     * Use rc `preloads` or fallback to an empty array
     */
    this.preloads = rcFile.preloads || []
  }

  /**
   * Loads start/app file from the project root. Also ensures that all
   * required exported props are defined
   */
  private _loadAppFile () {
    const appFile = join(this.appRoot, this.directories.start, 'app')
    const appExports = this._require(appFile)

    /**
     * Validate the required props to ensure they exists
     */
    const requiredExports = ['providers', 'aceProviders', 'commands']
    requiredExports.forEach((prop) => {
      if (!appExports[prop]) {
        throw new Exception(
          `export \`${prop}\` from \`${this.directories.start}/app\` file`,
          500,
          exceptionCodes.E_MISSING_APP_ESSENTIALS,
        )
      }
    })

    return appExports
  }

  /**
   * Instantiate IoC container
   */
  private _instantiateIoCContainer () {
    this.ioc = new Ioc(false)

    global['use'] = this.ioc.use.bind(this.ioc)
    global['make'] = this.ioc.make.bind(this.ioc)

    this.ioc.singleton('container', () => this.ioc)
  }

  /**
   * Register autoloads
   */
  private _registerAutoloads () {
    Object.keys(this.autoloads).forEach((alias) => {
      this.ioc.autoload(join(this.appRoot, this.autoloads[alias]), alias)
    })
  }

  /**
   * Register and boot service providers
   */
  private async _bootProviders () {
    const registrar = new Registrar(this.ioc)

    /**
     * Loads `start/app` file and use providers and aliases from it. In
     * case of `intent === ace`, also use `aceProviders`.
     */
    const { providers, aceProviders, aliases } = this._loadAppFile()
    const list = this._intent === 'ace' ? providers.concat(aceProviders) : providers

    /**
     * Register all providers
     */
    this._providersList = registrar.useProviders(list).register()
    this._providersWithExitHook = this._providersList.filter((provider) => typeof (provider.onExit) === 'function')

    /**
     * Register aliases after registering providers. This will override
     * the aliases defined by the providers, since user defined aliases
     * are given more preference.
     */
    if (aliases) {
      Object.keys(aliases).forEach((alias) => {
        this.ioc.alias(aliases[alias], alias)
      })
    }

    /**
     * Finally boot providers, which is an async process.
     */
    await registrar.boot(this._providersList)
  }

  /**
   * Binds the Helpers class to the IoC container as a
   * singleton
   */
  private _bindHelpers () {
    this.ioc.singleton('Adonis/Src/Helpers', () => new Helpers(this.appRoot, this.directories))
    this.ioc.alias('Adonis/Src/Helpers', 'Helpers')
  }

  /**
   * Preload files for the matching intent
   */
  private _preloadFiles () {
    this.preloads
      .filter((node) => node.intent === this._intent || !node.intent)
      .forEach((node) => {
        const loadFileAction = this._bootstrapper!.profile('load:file')
        this._require(join(this.appRoot, node.file), node.optional)
        loadFileAction.end()
      })
  }

  /**
   * Returns the profiler config by reading `config/app.js` file. This is
   * bit quirky, since all config files are supposed to be loaded by
   * the `ConfigProvider`. However, we need the profiler config
   * before we load providers.
   *
   * Another alternative is to have a seperate config for the profiler, which
   * is even worst, since we are creating multiple sources to store config.
   */
  private _getProfilerConfig () {
    const config = this._require(join(this.appRoot, this.directories.config, 'app'), true)
    return config && config.profiler ? config.profiler : {}
  }

  /**
   * Creates a new profiler instance and holds reference
   * to it
   */
  private _instantiateProfiler () {
    const profiler = new Profiler(this._getProfilerConfig())
    this.ioc.singleton('Adonis/Src/Profiler', () => profiler)
    this.ioc.alias('Adonis/Src/Profiler', 'Profiler')

    /**
     * Attach subscriber if exists
     */
    if (this._profilerSubscriber) {
      profiler.subscribe(this._profilerSubscriber)
    }

    this._bootstrapper = profiler.create('bootstrap', { intent: this._intent })
  }

  /**
   * Binds exception handler when it's namespace is
   * defined
   */
  private _bindExceptionHandler (server: ServerContract) {
    if (this._exceptionHandlerNamespace) {
      const handlerInstance = this.ioc.make(this._exceptionHandlerNamespace)
      server.onError(async (error, ctx) => {
        handlerInstance.report(error, ctx)

        const response = await handlerInstance.handle(error, ctx)
        if (useReturnValue(response, ctx)) {
          ctx.response.send(response)
        }
      })
    }
  }

  /**
   * Start the HTTP server by pulling it from the IoC container
   */
  private async _createHttpServer (serverCallback?: (handler) => any) {
    const server = this.ioc.use('Adonis/Src/Server')
    const router = this.ioc.use('Adonis/Src/Route')

    /**
     * Commit routes to the router store
     */
    const compileRouteAction = this._bootstrapper!.profile('compile:routes')
    router.commit()
    compileRouteAction.end()

    /**
     * Optimize server to cache handler
     */
    const optimizeServerAction = this._bootstrapper!.profile('optimize:server')
    server.optimize()
    optimizeServerAction.end()

    this._bindExceptionHandler(server)

    /**
     * Finally start the HTTP server and keep reference to
     * it
     */
    const handler = server.handle.bind(server)
    this.server = serverCallback ? serverCallback(handler) : createServer(handler)

    /**
     * Set Http or Https server as an instance on Adonis server
     */
    server.instance = this.server

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
   * Closes HTTP server and then executes all `onExit` hooks
   * before exiting the process.
   *
   * The HTTP is closed first, so that other unavailable resources
   * will not impact existing requests.
   */
  private _onExit () {
    this.server.close(async (error) => {
      if (error) {
        process.exit(1)
      }

      try {
        await Promise.all(this._providersWithExitHook.map((provider) => provider.onExit()))
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
   * Attach http server to a given port and host by picking it from
   * the `environment` variables.
   */
  private _listen () {
    return new Promise((resolve, reject) => {
      const startServerAction = this._bootstrapper!.profile('server:listen')

      const Env = this.ioc.use('Adonis/Src/Env')
      const Logger = this.ioc.use('Adonis/Src/Logger')
      const host = Env.get('HOST', '0.0.0.0')
      const port = Env.get('PORT', '3333')

      this.server.listen(port, host, (error: any) => {
        startServerAction.end()
        if (error) {
          reject(error)
        } else {
          Logger.info('started server on %s:%s', host, port)
          resolve()
        }
      })
    })
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
   * Attach subscriber to listen for profiler events
   */
  public onProfile (callback: ProfilerSubscriber): void {
    this._profilerSubscriber = callback
  }

  /**
   * Bootstrap the application
   */
  public async bootstrap () {
    /**
     * Load the rc file (ignore if file is missing)
     */
    this._loadRcFile()

    /**
     * New up IoC container
     */
    this._instantiateIoCContainer()

    /**
     * Instantiates the IoC container
     */
    this._instantiateProfiler()

    /**
     * Bind helpers as first class citizen
     */
    this._bindHelpers()

    /**
     * Boot all the providers
     */
    const providersAction = this._bootstrapper!.profile('boot:providers')
    await this._bootProviders()
    providersAction.end()

    /**
     * Register autoloaded directories
     */
    this._registerAutoloads()

    /**
     * Preload all files
     */
    this._preloadFiles()
  }

  /**
   * Bootstrap the app
   */
  public async startHttpServer (serverCallback?: (handler) => any) {
    this._intent = 'http'

    try {
      /**
       * Bootstrap the app
       */
      await this.bootstrap()

      /**
       * Create the server, but don't attach it to any port or host yet
       */
      await this._createHttpServer(serverCallback)

      /**
       * Make server listen to port and host defined inside `Environment` variables
       */
      await this._listen()

      /**
       * Attach on process signal events for graceful
       * shutdown
       */
      this._listenForExitEvents()

      /**
       * Memory cleanup
       */
      this._bootstrapper = null
      this.preloads = []
      this._providersList = []
    } catch (error) {
      this._prettyPrintError(error)
    }
  }
}
