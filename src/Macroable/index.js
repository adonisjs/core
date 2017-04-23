'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const CE = require('../Exceptions')

/**
 * @module Adonis
 * @submodule framework
 */

/**
 * This class is supposed to be extended by other
 * classes to allow a public api for extending
 * the class object via `getters` and `macros`.
 *
 * Also this class is used by {{#crossLink "Request"}}{{/crossLink}} and
 * {{#crossLink "Response"}}{{/crossLink}} classes.
 *
 * @class Macroable
 * @static
 */
class Macroable {
  /**
   * Define a macro to be attached to the class
   * `prototype`. Macros needs to be attached
   * only once and can be accessed on each
   * instance of class.
   *
   * @method macro
   * @static
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @throws {InvalidArgumentException} If callback is not a function
   *
   * @example
   * ```js
   * Request.macro('id', function () {
   *   this.uuid = this.uuid || uuid.v1()
   *   return this.uuid
   * })
   *
   * // usage
   * request.id()
   * ```
   */
  static macro (name, callback) {
    if (typeof (callback) !== 'function') {
      throw CE
        .InvalidArgumentException
        .invalidParamter(`${this.name}.macro expects callback to be a function or an asyncFunction`, callback)
    }

    this._macros[name] = callback
    this.prototype[name] = callback
  }

  /**
   * Return the callback method for a macro.
   *
   * @method getMacro
   * @static
   *
   * @param  {String} name
   *
   * @return {Function|Undefined}
   */
  static getMacro (name) {
    return this._macros[name]
  }

  /**
   * Returns a boolean indicating whether a macro
   * has been registered or not.
   *
   * @method hasMacro
   * @static
   *
   * @param  {String}  name
   *
   * @return {Boolean}
   */
  static hasMacro (name) {
    return !!(this.getMacro(name) && this.prototype[name])
  }

  /**
   * Define a getter on the class prototype. You should
   * use getter over macro, when you want the property
   * to be evaluated everytime it is accessed.
   *
   * @method getter
   * @static
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @throws {InvalidArgumentException} If callback is not a function
   *
   * @example
   * ```
   * Request.getter('time', function () {
   *   return new Date().getTime()
   * })
   *
   * // get current time
   * request.time
   * ```
   */
  static getter (name, callback) {
    if (typeof (callback) !== 'function') {
      throw CE
        .InvalidArgumentException
        .invalidParamter(`${this.name}.getter expects callback to be a function or an asyncFunction`, callback)
    }

    this._getters[name] = callback
    Object.defineProperty(this.prototype, name, {
      get: callback,
      configurable: true
    })
  }

  /**
   * Returns the callback method of getter.
   *
   * @method getGetter
   * @static
   *
   * @param  {String}  name
   *
   * @return {Callback}
   */
  getGetter (name) {
    return this._getters[name]
  }

  /**
   * Returns a boolean indicating whether getter exists
   * or not.
   *
   * @method hasGetter
   * @static
   *
   * @param  {String}  name
   *
   * @return {Boolean}
   */
  hasGetter (name) {
    return !!(this.getGetter(name) && this.prototype[name])
  }

  /**
   * Getters and macros are defined on the class prototype.
   * If for any reason you want to remove them, you should
   * call this method.
   *
   * @method hydrate
   * @static
   */
  static hydrate () {
    _.each(this._macros, (macro, key) => Reflect.deleteProperty(this.prototype, key))
    _.each(this._getters, (getter, key) => Reflect.deleteProperty(this.prototype, key))
    this._macros = {}
    this._getters = {}
  }
}

module.exports = Macroable
