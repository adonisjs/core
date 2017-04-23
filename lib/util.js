'use strict'

const util = exports = module.exports = {}

/**
 * Retruns a boolean indicating whether value is null
 * or undefined or not.
 *
 * @method existy
 *
 * @param  {Mixed} value
 *
 * @return {Boolean}
 */
util.existy = function (value) {
  return value !== null && typeof (value) !== 'undefined'
}

/**
 * Returns the value if not null or undefined or returns
 * the defaultValue, finally fallbacks to null
 *
 * @method valueOrDefault
 *
 * @param  {Mixed}       value
 * @param  {Mixed}       defaultValue
 *
 * @return {Mixed}
 */
util.valueOrDefault = function (value, defaultValue) {
  defaultValue = util.existy(defaultValue) ? defaultValue : null
  return util.existy(value) ? value : defaultValue
}

/**
 * Asyncify a normal function by returning
 * a promise
 *
 * @method asyncify
 *
 * @param  {Function} method
 *
 * @return {Function}
 */
util.asyncify = function (method) {
  if (method.constructor.name !== 'AsyncFunction') {
    return function (...args) {
      return new Promise((resolve, reject) => {
        try {
          resolve(method(...args))
        } catch (error) {
          reject(error)
        }
      })
    }
  }
  return method
}
