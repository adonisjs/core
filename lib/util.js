'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const util = exports = module.exports = {}


/**
 * @description tells whether value exists or not by checking
 * it type
 * @method existy
 * @param  {Mixed} value
 * @return {Boolean}
 */
util.existy = function (value) {
  return value !== undefined && value !== null
}
