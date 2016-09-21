'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
const path = require('path')
const dotenv = require('dotenv')
const util = require('../../lib/util')

/**
 * Manage environment variables by reading .env file
 * inside the project root.
 *
 * @class
 */
class Env {

  constructor (Helpers) {
    const envLocation = this.envPath()
    const options = {
      path: path.isAbsolute(envLocation) ? envLocation : path.join(Helpers.basePath(), envLocation),
      silent: process.env.ENV_SILENT || false,
      encoding: process.env.ENV_ENCODING || 'utf8'
    }
    dotenv.load(options)
  }

  /**
   * returns envPath by checking the environment variables
   *
   * @method envPath
   *
   * @return {String}
   *
   * @public
   */
  envPath () {
    if (!process.env.ENV_PATH || process.env.ENV_PATH.length === 0) {
      return '.env'
    }
    return process.env.ENV_PATH
  }

  /**
   * get value of an existing key from
   * env file.
   *
   * @param  {String} key - key to read value for
   * @param  {Mixed} [defaultValue] - default value to be used when actual value
   *                                  is undefined or null.
   * @return {Mixed}
   *
   * @example
   * Env.get('APP_PORT')
   * Env.get('CACHE_VIEWS', false)
   *
   * @public
   */
  get (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    let returnValue = process.env[key] || defaultValue
    if (returnValue === 'true' || returnValue === '1') {
      return true
    }
    if (returnValue === 'false' || returnValue === '0') {
      return false
    }
    return returnValue
  }

  /**
   * set/update value for a given key
   *
   * @param  {String} key - Key to set value for
   * @param  {Mixed} value - value to save next to defined key
   *
   * @example
   * Env.set('CACHE_VIEWS', true)
   *
   * @public
   */
  set (key, value) {
    process.env[key] = value
  }

}

module.exports = Env
