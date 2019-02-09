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
import { Registrar, Ioc } from '@adonisjs/fold'
import { Profiler, ProfilerRowContract, ProfilerSubscriber } from '@adonisjs/profiler'

import { Helpers } from '../Helpers'

/**
 * Preload file node. It must be defined as it is
 * inside `.adonisrc.json` file
 */
type PreloadNode = {
  file: string,
  intent: string,
  optional: boolean,
}

/**
 * Shape of `.adonisrc.json` file
 */
type RcFileNode = {
  typescript: boolean,
  preloads: PreloadNode[],
  autoloads: { [alias: string]: string },
  directories: { [identifier: string]: string },
}

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

  private _profilerSubscriber: ProfilerSubscriber

  constructor (public appRoot: string) {}

  /**
   * Require a module and optionally ignore error if file is missing
   */
  private _require (filePath: string, optional = false): any | null {
    try {
      return tsRequire(filePath, this.typescript)
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
          'E_MISSING_APP_ESSENTIALS',
        )
      }
    })

    return appExports
  }

  /**
   * Instantiate IoC container
   */
  private _instantiateIoCContainer () {
    this.ioc = new Ioc(false, this.typescript)

    global['use'] = this.ioc.use.bind(this.ioc)
    global['make'] = this.ioc.make.bind(this.ioc)
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
    const providersInstances = registrar.useProviders(list).register()

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
    await registrar.boot(providersInstances)
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
   * Bootstrap the application
   */
  private async _bootstrap () {
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
   * Start the HTTP server by pulling it from the IoC container
   */
  private _createHttp (serverCallback?: (handler) => any) {
    const server = this.ioc.use<any>('Adonis/Src/Server')
    const router = this.ioc.use<any>('Adonis/Src/Route')

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

    /**
     * Finally start the HTTP server and keep reference to
     * it
     */
    const handler = server.handle.bind(server)
    this.server = serverCallback ? serverCallback(handler) : createServer(server.handle.bind(server))
  }

  /**
   * Make HTTP server listen on a given port
   */
  private _listen (port, host?) {
    return new Promise((resolve, reject) => {
      const startServerAction = this._bootstrapper!.profile('server:listen')
      this.server.listen(port, host, (error) => {
        startServerAction.end()
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Attach subscriber to listen for profiler events
   */
  public onProfile (callback: ProfilerSubscriber): void {
    this._profilerSubscriber = callback
  }

  /**
   * Bootstrap the app
   */
  public async startHttpServer (serverCallback?: (handler) => any) {
    this._intent = 'http'
    try {
      await this._bootstrap()
      this._createHttp(serverCallback)

      const Env = this.ioc.use<any>('Adonis/Src/Env')
      await this._listen(Env.get('PORT'), Env.get('HOST'))
      this._bootstrapper = null
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}
