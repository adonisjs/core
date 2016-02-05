'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const util = exports = module.exports = {}
const _ = require('lodash')

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
