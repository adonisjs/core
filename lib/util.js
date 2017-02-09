'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

const _ = require('lodash')

const toStr = Object.prototype.toString
const fnToStr = Function.prototype.toString
const isFnRegex = /^\s*(?:function)?\*/

const util = exports = module.exports = {}

/**
 * tells whether value exists or not by checking
 * it type
 *
 * @param  {Mixed} value
 * @return {Boolean}
 *
 * @private
 */
util.existy = function (value) {
  return value !== undefined && value !== null
}

/**
 * @description returns an array from method arguments
 *
 * @method spread
 *
 * @return {Array}
 *
 * @private
 */
util.spread = function () {
  return _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
}

/**
 * tells whether a method is a genetator function or
 * not
 *
 * @method isGenerator
 *
 * @param  {Function}    method
 * @return {Boolean}
 *
 * @private
 */
util.isGenerator = function (method) {
  const viaToStr = toStr.call(method)
  const viaFnToStr = fnToStr.call(method)
  return (viaToStr === '[object Function]' || viaToStr === '[object GeneratorFunction]') && isFnRegex.test(viaFnToStr)
}
