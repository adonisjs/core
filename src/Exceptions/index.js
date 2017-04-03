'use strict'

/*
 * adonis-fold
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const NE = require('node-exceptions')

/**
 * Exceptions raised when arguments passed to a function
 * are invalid.
 *
 * @module Adonis
 * @submodule fold
 * @class InvalidArgumentException
 */
class InvalidArgumentException extends NE.InvalidArgumentException {
  /**
   * default error code to be used for raising
   * exceptions
   *
   * @attribute defaultErrorCode
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * This exception is raised when a manager does not
   * have the extend method.
   *
   * @static
   * @method invalidIocManager
   *
   * @param  {String} namespace
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidIocManager (namespace, code) {
    return new this(`Make sure ${namespace} does have a extend method. Report this issue to the provider author`, code || this.defaultErrorCode, 'E_INVALID_IOC_MANAGER')
  }

  /**
   * This exception is raised when the function
   * parameter is invalid.
   *
   * @static
   * @method invalidParameters
   *
   * @param  {String} message
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidParameters (message, code) {
    return new this(message, code || this.defaultErrorCode, 'E_INVALID_PARAMETER')
  }

  /**
   * The exception is raised when string passed to
   * Ioc.makeFunc is not valid.
   *
   * @static
   * @method invalidMakeString
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidMakeString (input, code) {
    return new this(`Ioc.makeFunc expects a string in module.method format instead received ${input}`, code || this.defaultErrorCode, 'E_INVALID_MAKE_STRING')
  }

  /**
   * This exception is raised when trying to extend a
   * binding which does not have a manager to be
   * used for extending the binding.
   *
   * @static
   * @method cannotBeExtended
   *
   * @param  {String} namespace
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static cannotBeExtended (namespace, code) {
    return new this(`${namespace} cannot be extended, since their is no public interface to extend`, code || this.defaultErrorCode, 'E_CANNOT_EXTEND_BINDING')
  }
}

/**
 * Exception thrown when something unexpected happens
 * while executing the code.
 *
 * @class RuntimeException
 * @module Adonis
 * @submodule fold
 */
class RuntimeException extends NE.RuntimeException {
  /**
   * default error code to be used for raising
   * exceptions
   *
   * @attribute defaultErrorCode
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * This exception is raised when a method being called
   * or accessed does not exists on a given parent.
   *
   * @method missingMethod
   *
   * @param  {String} parent
   * @param  {String} method
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingMethod (parent, method, code) {
    return new this(`Method ${method} missing on ${parent}`, code || this.defaultErrorCode, 'E_UNDEFINED_METHOD')
  }

  /**
   * This exception is raised when a service provider is not
   * extended by the base service provider class.
   *
   * @method invalidServiceProvider
   *
   * @param {String} name
   * @param {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidServiceProvider (name, code) {
    return new this(`${name} must extend base service provider class`, code || this.defaultErrorCode, 'E_INVALID_SERVICE_PROVIDER')
  }
}

module.exports = { InvalidArgumentException, RuntimeException }
