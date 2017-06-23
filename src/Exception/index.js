'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { resolver } = require('@adonisjs/fold')

class Exception {
  constructor () {
    this.clear()
  }

  /**
   * Clear the handlers and reporters object.
   *
   * @method clear
   *
   * @return {void}
   */
  clear () {
    this._handlers = {}
    this._reporters = {}
  }

  /**
   * Returns a boolean telling if a handler
   * exists for a given exception.
   *
   * NOTE: This does not check for wildcard handlers.
   * Calling `getHandler` may return handler if
   * wildcard exists.
   *
   * @method hasReporter
   *
   * @param  {String}    name
   *
   * @return {Boolean}
   */
  hasHandler (name) {
    return this._handlers[name]
  }

  /**
   * Returns a boolean telling if a reporter
   * exists for a given exception.
   *
   * NOTE: This does not check for wildcard reporters.
   * Calling `getReporter` may return reporter if
   * wildcard exists.
   *
   * @method hasReporter
   *
   * @param  {String}    name
   *
   * @return {Boolean}
   */
  hasReporter (name) {
    return this._reporters[name]
  }

  /**
   * Returns the handler for a given exception. Will fallback
   * to wildcard handler when defined
   *
   * @method getHandler
   *
   * @param  {String}   name
   *
   * @return {Function|Undefined}
   *
   * @example
   * ```
   * Exception.getHandler('UserNotFoundException')
   * ```
   */
  getHandler (name) {
    return this._handlers[name] || this._handlers['*']
  }

  /**
   * Returns the reporter for a given exception. Will fallback
   * to wildcard reporter when defined
   *
   * @method getReporter
   *
   * @param  {String}   name
   *
   * @return {Function|Undefined}
   *
   * @example
   * ```
   * Exception.getReporter('UserNotFoundException')
   * ```
   */
  getReporter (name) {
    return this._reporters[name] || this._reporters['*']
  }

  /**
   * Bind handler for a given exception
   *
   * @method handle
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @chainable
   *
   * ```js
   * Exception.handle('UserNotFoundException', async (error, { request, response }) => {
   *
   * })
   * ```
   */
  handle (name, callback) {
    this._handlers[name] = callback
    return this
  }

  /**
   * Binding reporter for a given exception
   *
   * @method report
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @chainable
   *
   * @example
   * ```js
   * Exception.report('UserNotFoundException', (error, request) => {
   *
   * })
   * ```
   */
  report (name, callback) {
    this._reporters[name] = callback
    return this
  }

  /**
   * Bind a class with `handle` and `report` method, instead
   * of manually binding methods.
   *
   * @method bind
   *
   * @param  {String} name
   * @param  {String} binding
   *
   * @chainable
   *
   * @example
   * ```js
   * Exception.bind('UserNotFoundException', 'User')
   *
   * // app/Exceptions/Handlers/User.js
   * class User {
   *   async handle (error, { request, response }) {
   *   }
   *
   *  async report (error, request) {
   *  }
   * }
   * ```
   */
  bind (name, binding) {
    const bindingInstance = resolver.forDir('exceptionHandlers').resolve(binding)
    if (bindingInstance.handle) {
      this.handle(name, bindingInstance.handle.bind(bindingInstance))
    }

    if (bindingInstance.report) {
      this.report(name, bindingInstance.report.bind(bindingInstance))
    }

    return this
  }
}

module.exports = new Exception()
