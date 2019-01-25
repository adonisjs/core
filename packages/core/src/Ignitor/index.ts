/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Exception } from '@adonisjs/utils'

/**
 * Shape for a preload file
 */
type PreloadFile = { file: string, optional: boolean, intent?: 'ace' | 'http' }

/**
 * Shape of `.adonisrc.json` file
 */
type RcConfig = {
  directories: { [key: string]: string },
  autoloads: { [key: string]: string },
  preloads: PreloadFile[],
  runtime: 'typescript' | 'javascript',
}

/**
 * Defaults to use when values are missing in
 * user defined config. The defaults are
 * deep merged
 */
const DEFAULTS: RcConfig = {
  directories: {
    controllers: 'Controllers/Http',
    models: 'Models',
    listeners: 'Listeners',
    exceptions: 'Exceptions',
  },
  preloads: [],
  autoloads: {
    app: 'App',
  },
  runtime: 'javascript',
}

/**
 * Ignitor does all the heavy lifting of crafting and running AdonisJs projects.
 * AdonisJs is super modular, which means someone and somewhere hard work
 * needs to be done to connect individual piece and make them work
 * great with each other.
 */
export class Ignitor {
  /**
   * Intent defines the reason for which the ignitor is
   * instantiated
   */
  private _intent: 'ace' | 'http'

  /**
   * Project base directories
   */
  private _baseDir = __dirname

  /**
   * Path to `.adonisrc.json` file
   */
  private _rcPath = join(this._baseDir, '.adonisrc.json')

  /**
   * A copy of pre-defined conventional directories
   */
  public directories: { [key: string]: string } = {}

  /**
   * An array of file to be preloaded. Again comes from `.adonisrc.json`
   * file
   */
  public preloads: PreloadFile[] = []

  /**
   * Require a module and ignore errors if it' missing
   */
  private _require (filePath: string, optional: boolean = false): any | null {
    try {
      return require(filePath)
    } catch (error) {
      if (['ENOENT', 'MODULE_NOT_FOUND'].indexOf(error.code) > -1 && optional) {
        return null
      }

      throw error
    }
  }

  /**
   * Parses `.adonisrc.json` file from the project root and use
   * the config values from their
   */
  private _parseRcFile () {
    const config: Partial<RcConfig> = this._require(this._rcPath, true) || {}

    this.directories = Object.assign(DEFAULTS.directories, config.directories)
    this.preloads = Object.assign(DEFAULTS.preloads, config.preloads)
  }

  /**
   * Preloads all files registered inside `.adonisrc.json` file under
   * `preloads` array.
   */
  private _preloadFiles () {
    this.preloads
      .filter((file) => !file.intent || file.intent === this._intent)
      .forEach((file) => this._require(join(this._baseDir, file.file), file.optional))
  }

  /**
   * Ensures that `forAce` or `forHttpServer` method has been called.
   */
  private _ensureIntent () {
    if (this._intent === undefined) {
      throw new Exception('Cannot start ignitor as intent is missing', 500, 'E_MISSING_IGNITOR_INTENT')
    }
  }

  /**
   * Set intent of ignitor for ace commands
   */
  public forAce (): this {
    this._intent = 'ace'
    return this
  }

  /**
   * Set intent of ignitor for http server.
   */
  public forHttpServer (): this {
    this._intent = 'http'
    return this
  }

  /**
   * Burn the ignitor by performing following tasks
   *
   * 1. Parse `.adonisrc.json` file
   * 2. Register and boot providers
   * 3. Preload files
   * 4. Run ace command or HTTP server
   */
  public start () {
    this._ensureIntent()
    this._parseRcFile()
    this._preloadFiles()
  }
}
