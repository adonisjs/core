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
const CE = require('../Exceptions')

let globalMiddleware = []
let namedMiddleware = {}

/**
 * composes a closure to an object for consistent behaviour
 *
 * @method  _composeFunction
 *
 * @param   {Function}         middleware
 *
 * @return  {Object}
 *
 * @private
 */
const _composeFunction = function (middleware) {
  return {instance: null, method: middleware, parameters: []}
}

/**
 * composes a consistent object from the actual
 * middleware object
 *
 * @method  _composeObject
 *
 * @param   {Object}       middleware
 *
 * @return  {Object}
 *
 * @private
 */
const _composeObject = function (middleware) {
  const instance = middleware.instance || null
  const method = instance ? instance[middleware.method] : middleware.method
  return {instance, method, parameters: middleware.parameters}
}

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
  globalMiddleware = globalMiddleware.concat(_.uniq(arrayOfMiddleware))
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
  _.each(namedMiddleware, (namespace, key) => Middleware.register(key, namespace))
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
  return globalMiddleware
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
 *
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
 * @example
 * Middleware.formatNamedMiddleware(['auth:basic,jwt'])
 * returns
 * {'Adonis/Middleware/Auth': ['basic', 'jwt']}
 *
 * @throws {RunTimeException} If named middleware for a given
 *                            key is not registered.
 * @public
 */
Middleware.formatNamedMiddleware = function (keys) {
  return _.reduce(keys, (structured, key) => {
    const tokens = key.split(':')
    const middlewareNamespace = namedMiddleware[tokens[0]]
    if (!middlewareNamespace) {
      throw CE.RuntimeException.missingNamedMiddleware(tokens[0])
    }
    structured[middlewareNamespace] = Middleware.fetchParams(tokens[1])
    return structured
  }, {})
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
 * @example
 * Middleware.resolve({}, true) // all global
 * Middleware.resolve(Middleware.formatNamedMiddleware(['auth:basic', 'acl:user']))
 *
 * @public
 */
Middleware.resolve = function (namedMiddlewareHash, includeGlobal) {
  const finalSet = includeGlobal ? Middleware.getGlobal().concat(_.keys(namedMiddlewareHash)) : _.keys(namedMiddlewareHash)
  return _.map(finalSet, (item) => {
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
Middleware.compose = function (middlewareList, request, response) {
  function * noop () {}
  return function * (next) {
    next = next || noop()
    _(middlewareList)
    .map((middleware) => {
      return typeof (middleware) === 'function' ? _composeFunction(middleware) : _composeObject(middleware)
    })
    .forEachRight((middleware) => {
      const values = [request, response, next].concat(middleware.parameters)
      next = middleware.method.apply(middleware.instance, values)
    })
    return yield * next
  }
}
