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
const debug = require('debug')('adonis:framework')

/**
 * The exception class is used to bind listeners
 * for specific exceptions or add a wildcard to
 * handle all exceptions.
 *
 * This module is used by the HTTP server to pull
 * exception handlers and call them to handle
 * the error.
 *
 * @binding Adonis/Src/Exception
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
  }

  /**
   * Returns the custom exception handler if defined
   *
   * @method getHandler
   *
   * @param {String} name
   *
   * @returns {Function|Undefined}
   */
  getHandler (name) {
    let handler = this._handlers[name]

    if (handler) {
      debug('found custom handler for %s', name)
      handler = resolver.resolveFunc(handler)
    }

    return handler
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
  getReporter (name) {
    let reporter = this._reporters[name]

    if (reporter) {
      debug('found custom reporter for %s', name)
      reporter = resolver.resolveFunc(reporter)
    }

    return reporter
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
    debug('binding handler for %s', name)
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
    debug('binding reporter for %s', name)
    this._reporters[name] = callback
    return this
  }
}

module.exports = new Exception()
