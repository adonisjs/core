'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const Ioc = require('adonis-fold').Ioc

let globalMiddleware = []
let namedMiddleware = {}

let Middleware = exports = module.exports = {}

/**
 * @description clears off existing middleware.
 * @method new
 * @return {void}
 * @public
 */
Middleware.new = function () {
  globalMiddleware = []
  namedMiddleware = {}
}

/**
 * @description registers a new middleware under global
 * or named middleware list
 * @method register
 * @param  {String} key
 * @param  {String} namespace
 * @return {void}
 * @public
 */
Middleware.register = function (key, namespace) {
  if (!namespace) {
    globalMiddleware.push(key)
    return
  }
  namedMiddleware[key] = namespace
}

/**
 * @description adds a array of middleware inside global list.
 * use for bulk register
 * @method global
 * @param  {Array} arrayOfMiddleware
 * @return {void}
 * @public
 */
Middleware.global = function (arrayOfMiddleware) {
  globalMiddleware = globalMiddleware.concat(arrayOfMiddleware)
}

/**
 * @description adds an object of middleware to named list.
 * use for bulk register
 * @method named
 * @param  {Object} namedMiddleware
 * @return {void}
 * @public
 */
Middleware.named = function (namedMiddleware) {
  _.each(namedMiddleware, function (namespace, key) {
    Middleware.register(key, namespace)
  })
}

/**
 * @description returns list of global middleware
 * @method getGlobal
 * @return {Array}
 * @public
 */
Middleware.getGlobal = function () {
  return _.uniq(globalMiddleware)
}

/**
 * @description returns list of named middleware
 * @method getNamed
 * @return {Object}
 * @public
 */
Middleware.getNamed = function () {
  return namedMiddleware
}

/**
 * @description fetch params for a named middleware
 * @method fetchParams
 * @param  {String|Undefined}    params [description]
 * @return {Array}           [description]
 * @public
 */
Middleware.fetchParams = function (params) {
  return params ? params.split(',') : []
}

/**
 * @description formats an array of named middleware by
 * returning it's namespace and parameters
 * @method formatNamedMiddleware
 * @param  {Array}              namedKeys [description]
 * @return {Object}                        [description]
 * @public
 */
Middleware.formatNamedMiddleware = function (namedKeys) {
  const structured = {}
  namedKeys.forEach(function (item) {
    const itemItems = item.split(':')
    const namespace = namedMiddleware[itemItems[0]]
    if (!namespace) {
      throw new Error(`Unable to resolve ${itemItems[0]}`)
    }
    structured[namespace] = Middleware.fetchParams(itemItems[1])
  })
  return structured
}

/**
 * @description resolves an array of middleware namespaces from
 * ioc container
 * @method resolve
 * @param  {Object} namedMiddlewareHash
 * @param  {Boolean} includeGlobal
 * @return {Array}
 * @public
 */
Middleware.resolve = function (namedMiddlewareHash, includeGlobal) {
  const finalSet = includeGlobal ? Middleware.getGlobal().concat(_.keys(namedMiddlewareHash)) : _.keys(namedMiddlewareHash)
  return _.map(finalSet, function (item) {
    const func = Ioc.makeFunc(`${item}.handle`)
    func.parameters = namedMiddlewareHash[item] || []
    return func
  })
}

/**
 * @description compose middleware to calls them in sequence.
 * something similar to koa-compose
 * @method compose
 * @param  {Array} middleware
 * @param  {Ojbect} request
 * @param  {Ojbect} response
 * @return {void}
 * @public
 */
Middleware.compose = function (middleware, request, response) {
  function * noop () {}
  return function * (next) {
    next = next || noop()
    let i = middleware.length
    while (i--) {
      const instance = middleware[i].instance
      const method = instance ? instance[middleware[i].method] : middleware[i].method
      const values = [request, response, next].concat(middleware[i].parameters)
      next = method.apply(instance, values)
    }
    yield * next
  }
}
