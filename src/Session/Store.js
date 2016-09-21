'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Type = require('type-of-is')
const _ = require('lodash')

/**
 * Session values store to guard and unguard
 * values.
 *
 * @exports SessionStore
 */
const Store = exports = module.exports = {}

/**
 * Guarding a key/value pair inside an object
 * by storing the original data type.
 *
 * @param  {String}  key
 * @param  {Mixed}  value
 *
 * @invalidTypes - Function, RegExp, Error
 *
 * @return {Object}
 *
 * @example
 * Store.guardPair('name', 'Foo') => {name: {d: 'Foo', t: 'String'}}
 */
Store.guardPair = function (key, value) {
  const type = Type.string(value)
  switch (type) {
    case 'Number':
      value = String(value)
      break
    case 'Object':
      value = JSON.stringify(value)
      break
    case 'Array':
      value = JSON.stringify(value)
      break
    case 'Boolean':
      value = String(value)
      break
    case 'Function':
      value = null
      break
    case 'RegExp':
      value = null
      break
    case 'Date':
      value = String(value)
      break
    case 'Error':
      value = null
      break
  }

  if (!value) {
    return value
  }

  return {d: value, t: type}
}

/**
 * Unguards a pair which was guarded earlier and
 * returns the original value with correct
 * data type.
 *
 * @param  {Object} pair
 *
 * @return {Mixed}
 *
 * @example
 * Store.unGuardPair({name: {d: 'Foo', t: 'String'}}) => {name: 'Foo'}
 *
 * @throws {InvalidArgumentException} If pair does not have d & t properties
 */
Store.unGuardPair = function (pair) {
  if (!pair || !pair.d || !pair.t) {
    throw new Error('Cannot unguard unrecognized pair type')
  }

  /** if parsed do not re parse */
  if (typeof (pair.d) === pair.t.toLowerCase()) {
    return pair.d
  }

  switch (pair.t) {
    case 'Number':
      pair.d = Number(pair.d)
      break
    case 'Object':
      try { pair.d = JSON.parse(pair.d) } catch (e) {}
      break
    case 'Array':
      try { pair.d = JSON.parse(pair.d) } catch (e) {}
      break
    case 'Boolean':
      pair.d = pair.d === 'true' || pair.d === '1'
      break
  }

  return pair.d
}

/**
 * Pack values from a plain object to an object to be
 * saved as JSON.stringfied string
 *
 * @param   {Object}    values
 *
 * @return  {Object}
 */
Store.packValues = function (values) {
  return _.transform(values, (result, value, key) => {
    const body = Store.guardPair(key, value)
    if (body) {
      result[key] = body
    }
    return result
  }, {})
}

/**
 * Unpack values from store to a normal object
 *
 * @param   {Object}      values
 *
 * @return  {Object}
 */
Store.unPackValues = function (values) {
  return _.transform(values, (result, value, index) => {
    result[index] = Store.unGuardPair(value)
    return result
  }, {}) || {}
}
