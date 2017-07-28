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
    this._bindings = {}
  }

  /**
   * Returns the handler for a given exception. Will fallback
   * to wildcard handler when defined
   *
   * @method getHandler
   *
   * @param  {String}   name
   * @param  {Boolean} [ignoreWildcard = false] Ignore wildcard handler
   *
   * @return {Function|Undefined}
   *
   * @example
   * ```
   * Exception.getHandler('UserNotFoundException')
   * ```
   */
  getHandler (name, ignoreWildcard = false) {
    const binding = this._bindings[name]
    let handler

    /**
     * Give priority to binding when it exists,
     * then look for inline handler and finally
     * fallback to wildcard if required
     */
    if (binding) {
      const bindingInstance = resolver.forDir('exceptionHandlers').resolve(binding)
      if (typeof (bindingInstance.handle) === 'function') {
        handler = bindingInstance.handle.bind(bindingInstance)
      }
    } else {
      handler = this._handlers[name]
    }

    /**
     * If ignoreWildcard is false and there is no
     * handler, return the wildcard handler
     */
    if (!handler && !ignoreWildcard) {
      return this.getWildcardHandler()
    }

    return handler
  }

  /**
   * Returns the wildcard handler for the exception
   *
   * @method getWildcardHandler
   *
   * @return {Function|Undefined}
   */
  getWildcardHandler () {
    return this._handlers['*']
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
  getReporter (name, ignoreWildcard = false) {
    const binding = this._bindings[name]
    let reporter

    /**
     * Give priority to binding when it exists,
     * then look for inline reporter and finally
     * fallback to wildcard if required
     */
    if (binding) {
      const bindingInstance = resolver.forDir('exceptionHandlers').resolve(binding)
      if (typeof (bindingInstance.report) === 'function') {
        reporter = bindingInstance.report.bind(bindingInstance)
      }
    } else {
      reporter = this._reporters[name]
    }

    /**
     * If ignoreWildcard is false and there is no
     * reporter, return the wildcard reporter
     */
    if (!reporter && !ignoreWildcard) {
      return this.getWildcardReporter()
    }

    return reporter
  }

  /**
   * Returns the wildcard reporter for the exception
   *
   * @method getWildcardReporter
   *
   * @return {Function|Undefined}
   */
  getWildcardReporter () {
    return this._reporters['*']
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
    this._bindings[name] = binding
    return this
  }
}

module.exports = new Exception()
