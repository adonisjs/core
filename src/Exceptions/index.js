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

class InvalidArgumentException extends NE.InvalidArgumentException {

  /**
   * default error code to be used for raising
   * exceptions
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * This exception is raised when a manager does not
   * have extend method.
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
   * parameter is invalid
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
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidMakeString (input, code) {
    return new this(`Ioc.makeFunc expects a string in module.method format instead received ${input}`, code || this.defaultErrorCode, 'E_INVALID_MAKE_STRING')
  }
}

class RuntimeException extends NE.RuntimeException {

  /**
   * default error code to be used for raising
   * exceptions
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
   * @param  {String} parent
   * @param  {String} method
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingMethod (parent, method, code) {
    return new this(`Method ${method} missing on ${parent}`, code || this.defaultErrorCode, 'E_UNDEFINED_METHOD')
  }
}

module.exports = { InvalidArgumentException, RuntimeException }
