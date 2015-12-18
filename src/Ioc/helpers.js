'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const dwell = require('dwell')
const _ = require('lodash')

let helpers = exports = module.exports = {}

/**
 * @description simple check to figure out whether
 * namespace belongs to autoload path
 * @method isAutoLoadPath
 * @param  {Object}       autoload
 * @param  {String}       namespace
 * @return {Boolean}
 * @private
 */
helpers.isAutoLoadPath = function (autoload, namespace) {
  return namespace.startsWith(autoload.namespace)
}

/**
 * @description inspect class constructor for dependencies
 * and replace _ with / to create valid namespace.
 * @method introspect
 * @param  {String}   defination
 * @return {Array}
 * @private
 */
helpers.introspect = function (defination) {
  return _.map(dwell.inspect(defination), function (injection) {
    return injection.replace(/_/g, '/')
  })
}
