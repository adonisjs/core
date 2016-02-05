'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const requireAll = require('require-all')
const _ = require('lodash')
const util = require('../../lib/util')

/**
 * Manage configuration for an application by
 * reading all .js files from config directory.
 */
class Config {

  constructor (Helpers) {
    const configPath = Helpers.configPath()
    /**
     * @type {Object}
     */
    this.config = requireAll({
      dirname: configPath,
      filters: /(.*)\.js$/
    })
  }

  /**
   * get value for a given key from config store.
   *
   * @param  {String} key - Configuration key to return value for
   * @param  {Mixed} [defaultValue] - Default value to return when actual value
   *                                  is null or undefined
   * @return {Mixed}
   *
   * @example
   * Config.get('database.connection')
   * Config.get('database.mysql.host')
   *
   * @public
   */
  get (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const returnValue = _.get(this.config, key)
    return util.existy(returnValue) ? returnValue : defaultValue
  }

  /**
   * set/update value for a given key inside
   * config store.
   *
   * @param  {String} key - Key to set value for
   * @param  {Mixed} value - Value to be saved next to defined key
   *
   * @example
   * Config.set('database.connection', 'mysql')
   * Config.set('database.mysql.host', 'localhost')
   *
   * @public
   */
  set (key, value) {
    _.set(this.config, key, value)
  }
}

module.exports = Config
