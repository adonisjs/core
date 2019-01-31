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
   * Ensure the `intent` is defined, otherwise ignitor won't be able to bootstrap
   * the app properly
   */
  private _ensureIntent () {
    if (!this._intent) {
      throw new Exception('ignitor intent is required to bootstrap the application', 500, 'E_MISSING_IGNITOR_INTENT')
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
   * Register and boot service providers
   */
  private async _bootProviders () {
    this.ioc = new Ioc(false, this.typescript)
    const registrar = new Registrar(this.ioc)

    /**
     * Bind helpers right after instantiating IoC container
     */
    this._bindHelpers()

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
      .forEach((node) => this._require(join(this.appRoot, node.file), node.optional))
  }

  /**
   * Start the HTTP server by pulling it from the IoC container
   */
  private _runHttpServer () {
    return new Promise((resolve, reject) => {
      const server = this.ioc.use<any>('Adonis/Src/Server')
      const router = this.ioc.use<any>('Adonis/Src/Route')

      /**
       * Commit routes to the router store
       */
      router.commit()

      /**
       * Optimize server to cache handler
       */
      server.optimize()

      /**
       * Finally start the HTTP server and keep reference to
       * it
       */
      this.server = createServer(server.handle.bind(server))

      this.server.listen(process.env.PORT, process.env.HOST, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Set intent to ace
   */
  public forAce (): this {
    this._intent = 'ace'
    return this
  }

  /**
   * Set intent to http server
   */
  public forHttpServer (): this {
    this._intent = 'http'
    return this
  }

  /**
   * Bootstrap the app
   */
  public async start () {
    try {
      /**
       * Intent is required before we can do anything else
       */
      this._ensureIntent()

      /**
       * Load the rc file (ignore if file is missing)
       */
      this._loadRcFile()

      /**
       * Boot all the providers
       */
      await this._bootProviders()

      /**
       * Preload all files
       */
      this._preloadFiles()

      if (this._intent === 'http') {
        await this._runHttpServer()
      }
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}
