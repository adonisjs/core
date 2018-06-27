/**
 * @module Core
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
*/

import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import Debug from 'debug'
import dotenv from 'dotenv'
import GE from '@adonisjs/generic-exceptions'

const debug = Debug('adonis:framework')

/**
 * Manages the application environment variables by
 * reading the `.env` file from the project root.
 *
 * If `.env` file is missing, an exception will be thrown
 * to supress the exception, pass `ENV_SILENT=true` when
 * starting the app.
 *
 * Can define different location by setting `ENV_PATH`
 * environment variable.
 */
class Env {
  /**
   * Path to the application root directory
   */
  public appRoot: string

  /**
   * Constructor.
   *
   * @param  appRoot  Path to the application root directory
   */
  constructor (appRoot: string) {
    this.appRoot = appRoot
    const bootedAsTesting = process.env.NODE_ENV === 'testing'
    const env = this.load(this.getEnvPath(), false) // do not overwrite at first place

    /**
     * Throwing the exception when ENV_SILENT is not set to true
     * and ofcourse there is an error
     */
    if (env.error && process.env.ENV_SILENT !== 'true') {
      throw env.error
    }

    /**
     * Load the `.env.testing` file if app was booted
     * under testing mode
     */
    if (bootedAsTesting) {
      this.load('.env.testing')
    }
  }

  /**
   * Replacing dynamic values inside .env file
   *
   * @param  env        Environement key to change
   * @param  envConfig  Environement value
   */
  private _interpolate (env: string, envConfig: Object): string {
    const matches = env.match(/\$([a-zA-Z0-9_]+)|\${([a-zA-Z0-9_]+)}/g) || []
    _.each(matches, (match) => {
      const key = match.replace(/\$|{|}/g, '')
      const variable = envConfig[key] || process.env[key] || ''
      env = env.replace(match, this._interpolate(variable, envConfig))
    })

    return env
  }

  /**
   * Load env file from a given location.
   *
   * @param  filePath
   * @param  overwrite
   * @param  encoding
   */
  public load (filePath: string, overwrite: boolean = true, encoding: string = 'utf8') {
    const options = {
      path: path.isAbsolute(filePath) ? filePath : path.join(this.appRoot, filePath),
      encoding
    }

    try {
      const envConfig = dotenv.parse(fs.readFileSync(options.path, options.encoding))

      /**
       * Dotenv doesn't overwrite existing env variables, so we
       * need to do it manaully by parsing the file.
       */
      debug('%s environment file from %s', overwrite ? 'merging' : 'loading', options.path)

      /**
       * Loop over values and set them on environment only
       * when actual value is not defined or overwrite
       * is set to true
       */
      _.each(envConfig, (value, key) => {
        if (process.env[key] === undefined || overwrite) {
          process.env[key] = this._interpolate(value, envConfig)
        }
      })
      return { parsed: envConfig }
    } catch (error) {
      return { error }
    }
  }


  /**
   * Returns the path from where the `.env`
   * file should be loaded.
   */
  public getEnvPath (): string {
    if (!process.env.ENV_PATH || process.env.ENV_PATH.length === 0) {
      return '.env'
    }
    return process.env.ENV_PATH
  }

  /**
   * Get value for a given key from the `process.env`
   * object.
   *
   * @param  key            Key to retrieve
   * @param  defaultValue   Default value when not defined
   *
   * @example
   * ```js
   * Env.get('CACHE_VIEWS', false)
   * ```
   */
  public get (key: string, defaultValue: string | number | null = null): string  |number|null|undefined {
    return _.get(process.env, key, defaultValue)
  }

  /**
   * Get value for a given key from the `process.env`
   * object or throw an error if the key does not exist.
   *
   * @param  key  Key to retrieve
   *
   * @example
   * ```js
   * Env.getOrFail('MAIL_PASSWORD')
   * ```
   */
  public getOrFail (key: string): string|number|null|undefined {
    const val = _.get(process.env, key)

    if (_.isUndefined(val)) {
      throw GE.RuntimeException.missingEnvKey(key)
    }

    return val
  }

  /**
   * Set value for a given key inside the `process.env`
   * object. If value exists, will be updated
   *
   * @param  key    Key to set
   * @param  value  Value to set
   *
   * @example
   * ```js
   * Env.set('PORT', 3333)
   * ```
   */
  public set (key: string, value: string|number): void {
    _.set(process.env, key, value)
  }
}

export { Env }
