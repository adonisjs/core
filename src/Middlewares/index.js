'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')

/**
 * storing reference to global middlewares
 * @private
 */
let globalMiddleware = []

/**
 * storing reference to named (key/value) middlewares
 * @private
 */
let namedMiddleware = []

/**
 * @module Middleware
 * @description Stores middleware registered on a given application.
 */
let Middlewares = exports = module.exports = {}

/**
 * @function clear
 * @description clear middleware stack
 * @public
 */
Middlewares.clear = function () {
  globalMiddleware = []
  namedMiddleware = []
}

/**
 * @function global
 * @description register an array of middleware
 * to stack as global middleware.
 * @param  {Array} arrayOfMiddleware
 */
Middlewares.global = function (arrayOfMiddleware) {
  globalMiddleware = arrayOfMiddleware
}

/**
 * @function named
 * @description register key/value pairs of middleware
 * to middleware stack
 * @param  {Object} objectOfMiddleware
 */
Middlewares.named = function (objectOfMiddleware) {
  namedMiddleware = objectOfMiddleware
}

/**
 * @function get
 * @description returns named middleware based upon requested
 * keys and all global middleware
 * @param  {Array} keys
 * @return {Array}
 */
Middlewares.get = function (keys) {
  let named = _.pick(namedMiddleware, keys)
  named = _.size(named) > 0 ? _.values(named) : []
  return _(globalMiddleware).concat(named).value()
}
