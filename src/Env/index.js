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
    dotenv.load({path: path.join(Helpers.basePath(), '.env')})
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
