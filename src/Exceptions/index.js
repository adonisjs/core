'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const NE = require('node-exceptions')
const upcast = require('upcast')

const toValueType = function (value) {
  const type = upcast.type(value)
  return type === 'object' ? `${type}:${JSON.stringify(value, null, 2)}` : `${type}:${upcast.to(value, 'string')}`
}

/**
 * @module Adonis
 * @submodule framework
 */

/**
 * Exception thrown whenever the function/method argument
 * is invalid.
 *
 * @class InvalidArgumentException
 * @constructor
 */
class InvalidArgumentException extends NE.InvalidArgumentException {

  /**
   * Throws exception by instantiating the class and setting error code
   * to `E_INVALID_PARAMETER`.
   *
   * @method invalidParamter
   *
   * @param  {String}        message
   * @param  {Mixed}         [actualValue]
   *
   * @return {Object}
   */
  static invalidParamter (message, actualValue = null) {
    message = actualValue ? `${message} instead received {${toValueType(actualValue)}}` : message
    return new this(message, 500, 'E_INVALID_PARAMETER')
  }
}

/**
 * Class to throw runtime exceptions.
 *
 * @class RuntimeException
 * @constructor
 */
class RuntimeException extends NE.RuntimeException {
  /**
   * This exception is thrown when someone tries to make
   * use of nested groups using `Route.group`.
   *
   * @method nestedGroup
   *
   * @return {Object}
   */
  static nestedGroup () {
    return new this('Nested route groups are not allowed', 500, 'E_NESTED_ROUTE_GROUPS')
  }

  /**
   * This exception is thrown when a named middleware is referenced
   * but never registered with the `Server` provider
   *
   * @method missingNamedMiddleware
   *
   * @param  {String}               name
   *
   * @return {Object}
   */
  static missingNamedMiddleware (name) {
    return new this(`Cannot find any named middleware for {${name}}. Make sure you have registered it inside start/kernel.js file.`, 500, 'E_MISSING_NAMED_MIDDLEWARE')
  }
}

module.exports = { InvalidArgumentException, RuntimeException, HttpException: NE.HttpException }
