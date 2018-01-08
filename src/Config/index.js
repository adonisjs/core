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
const requireAll = require('require-all')
const debug = require('debug')('adonis:framework')

/**
 * Manages configuration by recursively reading all
 * `.js` files from the `config` folder.
 *
 * @alias Config
 * @binding Adonis/Src/Config
 * @group Core
 * @singleton
 *
 * @class Config
 * @constructor
 *
 * @param {String} configPath Absolute path from where to load the config files from
 */
class Config {
  constructor (configPath) {
    this._configPath = configPath
    this._config = {}
    this.syncWithFileSystem()
  }

  /**
   * Returns whether the value of the key is a self referenced
   * identifier
   *
   * @method _isSelfReference
   *
   * @param  {String}         value
   *
   * @return {Boolean}
   *
   * @private
   */
  _isSelfReference (value) {
    return typeof (value) === 'string' && value.startsWith('self::')
  }

  /**
   * Returns the actual key by dropping the self::
   * keyword
   *
   * @method _getKeyFromRefrence
   *
   * @return {String}
   *
   * @private
   */
  _getKeyFromRefrence (value) {
    return value.replace(/^self::/, '')
  }

  /**
   * Syncs the in-memory config store with the
   * file system. Ideally you should keep your
   * config static and never update the file
   * system on the fly.
   *
   * @method syncWithFileSystem
   *
   * @return {void}
   */
  syncWithFileSystem () {
    try {
      this._config = requireAll({
        dirname: this._configPath,
        filter: /(.*)\.js$/
      })
      debug('loaded all config files from %s', this._configPath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Get value for a given key from the config store. Nested
   * values can be accessed via (dot notation). Values
   * referenced with `self::` are further resolved.
   *
   * @method get
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue]
   *
   * @return {Mixed}
   *
   * @example
   * ```
   * Config.get('database.mysql')
   *
   * // referenced
   * {
   *   prodMysql: 'self::database.mysql'
   * }
   * Config.get('database.prodMysql')
   * ```
   */
  get (key, defaultValue) {
    const value = _.get(this._config, key, defaultValue)
    if (this._isSelfReference(value)) {
      return this.get(this._getKeyFromRefrence(value))
    }
    return value
  }

  /**
   * Merge default values with the resolved values.
   * This is to provide a default set of values
   * when it does not exists. This method uses
   * lodash `_.mergeWith` method.
   *
   * @method merge
   *
   * @param  {String}   key
   * @param  {Object}   defaultValues
   * @param  {Function} [customizer]
   *
   * @return {Object}
   *
   * @example
   * ```js
   * Config.merge('services.redis', {
   *   port: 6379,
   *   host: 'localhost'
   * })
   * ```
   */
  merge (key, defaultValues, customizer) {
    const value = this.get(key, {})
    return _.mergeWith(defaultValues, value, (newValues, existingValues, ...args) => {
      let resolvedValue

      if (this._isSelfReference(existingValues)) {
        resolvedValue = this.get(this._getKeyFromRefrence(existingValues))
      }

      if (typeof (customizer) === 'function') {
        return customizer(newValues, resolvedValue, ...args)
      }

      return resolvedValue
    })
  }

  /**
   * Update value for a given key inside the config store. If
   * value does not exists it will be created.
   *
   * ## Note
   * This method updates the value in memory and not on the
   * file system.
   *
   * @method set
   *
   * @param  {String} key
   * @param  {Mixed}  value
   *
   * @example
   * ```js
   * Config.set('database.mysql.host', '127.0.0.1')
   *
   * // later get the value
   * Config.get('database.mysql.host')
   * ```
   */
  set (key, value) {
    _.set(this._config, key, value)
  }
}

module.exports = Config
