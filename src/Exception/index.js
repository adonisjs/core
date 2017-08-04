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

/**
 * The exception class is used to bind listeners
 * for specific exceptions or add a wildcard to
 * handle all exceptions.
 *
 * This module is used by the HTTP server to pull
 * exception handlers and call them to handle
 * the error.
 *
 * @namespace Adonis/Src/Exception
 * @group Http
 * @alias Exception
 * @singleton
 *
 * @class Exception
 * @constructor
 */
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
   * to wildcard handler when defined.
   *
   * @method getHandler
   *
   * @param  {String}   name - Exception name
   * @param  {Boolean} [ignoreWildcard = false] Do not return wildcard handler
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
   * Returns the wildcard handler for the exceptions
   *
   * @method getWildcardHandler
   *
   * @return {Function|Undefined}
   *
   * @example
   * ```
   * Exception.getWildcardHandler()
   * ```
   */
  getWildcardHandler () {
    return this.getHandler('*', true)
  }

  /**
   * Returns the reporter for a given exception. Will fallback
   * to wildcard reporter when defined
   *
   * @method getReporter
   *
   * @param  {String}   name - The exception name
   * @param  {Boolean} [ignoreWildcard = false] Do not return wildcard handler
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
   * Returns the wildcard reporter for exceptions.
   *
   * @method getWildcardReporter
   *
   * @return {Function|Undefined}
   *
   * @example
   * ```js
   * Exception.getWildcardReporter()
   * ```
   */
  getWildcardReporter () {
    return this.getReporter('*')
  }

  /**
   * Bind handler for a single exception
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
   * Exception.report('UserNotFoundException', (error, { request }) => {
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
   *  async report (error, { request }) {
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
