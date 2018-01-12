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
    const isSelfReference = typeof (value) === 'string' && value.startsWith('self::')
    if (isSelfReference) {
      console.warn(`Self referencing config has been depreciated. We recommend to you manually define the value for ${this._getKeyFromRefrence(value)}`)
      return true
    }
    return false
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
   * Returns whether value is a plain object or not
   *
   * @method _isPlainObject
   *
   * @param  {Mixed}       value
   *
   * @return {Boolean}
   *
   * @private
   */
  _isPlainObject (value) {
    return value && !Array.isArray(value) && typeof (value) === 'object'
  }

  /**
   * Resolve nested values recursively
   *
   * @method _resolveValues
   *
   * @param  {Object}       values
   *
   * @return {Object}
   *
   * @private
   */
  _resolveValues (values) {
    return _.reduce(values, (result, value, key) => {
      if (this._isPlainObject(value)) {
        result[key] = this._resolveValues(value)
      } else {
        result[key] = this._isSelfReference(value) ? this.get(this._getKeyFromRefrence(value)) : value
      }
      return result
    }, {})
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
    if (this._isPlainObject(value)) {
      return this._resolveValues(value)
    }
    return this._isSelfReference(value) ? this.get(this._getKeyFromRefrence(value)) : value
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
    return _.mergeWith(defaultValues, value, customizer)
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
