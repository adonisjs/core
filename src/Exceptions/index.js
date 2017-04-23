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

class InvalidArgumentException extends NE.InvalidArgumentException {
  static invalidParamter (message, actualValue) {
    message = actualValue ? `${message} instead received {${toValueType(actualValue)}}` : message
    return new this(message, 500, 'E_INVALID_PARAMETER')
  }
}

class RuntimeException extends NE.RuntimeException {
  static nestedGroup () {
    return new this('Nested route groups are not allowed', 500, 'E_NESTED_ROUTE_GROUPS')
  }

  static missingNamedMiddleware (name) {
    return new this(`Cannot find any named middleware for {${name}}. Make sure you have registered it inside start/kernel.js file.`, 500, 'E_MISSING_NAMED_MIDDLEWARE')
  }
}

module.exports = { InvalidArgumentException, RuntimeException, HttpException: NE.HttpException }
