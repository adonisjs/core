'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const Ioc = require('adonis-fold').Ioc
const NE = require('node-exceptions')

let globalMiddleware = []
let namedMiddleware = {}

/**
 * Http middleware layer to register and resolve middleware
 * for a given HTTP request.
 * @module Middleware
 */
let Middleware = exports = module.exports = {}

/**
 * clears off all global and named middleware
 *
 * @method new
 *
 * @public
 */
Middleware.new = function () {
  globalMiddleware = []
  namedMiddleware = {}
}

/**
 * registers a new global or named middleware. If second
 * parameter is empty, middleware will be considered
 * global.
 *
 * @method register
 *
 * @param  {String} [key] - unqiue key for named middleware
 * @param  {String} namespace - Reference to the binding of Ioc container
 *
 * @example
 * Middleware.register('App/Http/Middleware/Auth')
 * Middleware.register('app', 'App/Http/Middleware/Auth')
 *
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
 * concats a array of middleware inside global list.
 *
 * @method global
 *
 * @param  {Array} arrayOfMiddleware
 *
 * @example
 * Middleware.global(['App/Http/Middleware/Auth', '...'])
 *
 * @public
 */
Middleware.global = function (arrayOfMiddleware) {
  globalMiddleware = globalMiddleware.concat(arrayOfMiddleware)
}

/**
 * adds an object of middleware to named list.
 *
 * @method named
 *
 * @param  {Object} namedMiddleware
 *
 * @example
 * Middleware.named({'auth': 'App/Http/Middleware/Auth'}, {...})
 *
 * @public
 */
Middleware.named = function (namedMiddleware) {
  _.each(namedMiddleware, function (namespace, key) {
    Middleware.register(key, namespace)
  })
}

/**
 * returns list of global middleware
 *
 * @method getGlobal
 *
 * @return {Array}
 *
 * @public
 */
Middleware.getGlobal = function () {
  return _.uniq(globalMiddleware)
}

/**
 * returns list of named middleware
 *
 * @method getNamed
 *
 * @return {Object}
 *
 * @public
 */
Middleware.getNamed = function () {
  return namedMiddleware
}

/**
 * fetch params defined next to named middleware while
 * consuming them.
 * @method fetchParams
 *
 * @param  {String|Undefined}    params
 * @return {Array}
 *
 * @public
 */
Middleware.fetchParams = function (params) {
  return params ? params.split(',') : []
}

/**
 * returning an object of named middleware by
 * parsing them.
 *
 * @method formatNamedMiddleware
 *
 * @param  {Array}              keys
 * @return {Object}
 *
 * @throws {RunTimeException} If named middleware for a given
 *                            key is not registered.
 * @public
 */
Middleware.formatNamedMiddleware = function (keys) {
  const structured = {}
  keys.forEach(function (key) {
    const keyOptions = key.split(':')
    const namespace = namedMiddleware[keyOptions[0]]
    if (!namespace) {
      throw new NE.RuntimeException(`${keyOptions[0]} is not registered as a named middleware`)
    }
    structured[namespace] = Middleware.fetchParams(keyOptions[1])
  })
  return structured
}

/**
 * resolves an array of middleware namespaces from
 * ioc container
 *
 * @method resolve
 *
 * @param  {Object} namedMiddlewareHash
 * @param  {Boolean} [includeGlobal=false]
 *
 * @return {Array}
 *
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
 * composes middleware and calls them in sequence something similar
 * to koa-compose.
 *
 * @method compose
 *
 * @param  {Array} Middleware - Array of middleware resolved from Ioc container
 * @param  {Object} request - Http request object
 * @param  {Object} response - Http response object
 *
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
    return yield * next
  }
}
