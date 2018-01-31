'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs')
const debug = require('debug')('adonis:framework')

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
 *
 * @binding Adonis/Src/Env
 * @group Core
 * @alias Env
 * @singleton
 *
 * @class Env
 * @constructor
 */
class Env {
  constructor (appRoot) {
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
   * @method _interpolate
   *
   * @param  {String}     env
   * @param  {Object}     envConfig
   *
   * @return {String}
   *
   * @private
   */
  _interpolate (env, envConfig) {
    const matches = env.match(/\$([a-zA-Z0-9_]+)|\${([a-zA-Z0-9_]+)}/g) || []
    _.each(matches, (match) => {
      const key = match.replace(/\$|{|}/g, '')
      const variable = envConfig[key] || process.env[key] || ''
      env = env.replace(match, this._interpolate(variable))
    })
    return env
  }

  /**
   * Load env file from a given location.
   *
   * @method load
   *
   * @param  {String}  filePath
   * @param  {Boolean} [overwrite = 'true']
   * @param  {String}  [encoding = 'utf8']
   *
   * @return {void}
   */
  load (filePath, overwrite = true, encoding = 'utf8') {
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
   *
   * @method getEnvPath
   *
   * @return {String}
   */
  getEnvPath () {
    if (!process.env.ENV_PATH || process.env.ENV_PATH.length === 0) {
      return '.env'
    }
    return process.env.ENV_PATH
  }

  /**
   * Get value for a given key from the `process.env`
   * object.
   *
   * @method get
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue = null]
   *
   * @return {Mixed}
   *
   * @example
   * ```js
   * Env.get('CACHE_VIEWS', false)
   * ```
   */
  get (key, defaultValue = null) {
    return _.get(process.env, key, defaultValue)
  }

  /**
   * Set value for a given key inside the `process.env`
   * object. If value exists, will be updated
   *
   * @method set
   *
   * @param  {String} key
   * @param  {Mixed} value
   *
   * @return {void}
   *
   * @example
   * ```js
   * Env.set('PORT', 3333)
   * ```
   */
  set (key, value) {
    _.set(process.env, key, value)
  }
}

module.exports = Env
