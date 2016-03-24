'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const Ioc = require('adonis-fold').Ioc
const NE = require('node-exceptions')

let helpers = exports = module.exports = {}

/**
 * returns an array of middleware concatenated with
 * the actual route handler.
 *
 * @param  {Object}         resolvedRoute
 * @param  {Object}         middleware
 * @param  {String}         appNamespace
 * @return {Array}
 *
 * @private
 */

helpers.makeRouteAction = function (resolvedRoute, middleware, appNamespace) {
  const routeMiddleware = middleware.resolve(middleware.formatNamedMiddleware(resolvedRoute.middlewares), false)
  const routeAction = helpers.constructRouteAction(resolvedRoute, appNamespace)
  return routeMiddleware.concat([routeAction])
}

/**
 * returns an array of global middleware followed by the request
 * finalHandler.
 * @method makeRequestAction
 * @param  {Object}          middleware
 * @param  {Function}        finalHandler
 * @return {Array}
 */
helpers.makeRequestAction = function (middleware, finalHandler) {
  return middleware.resolve([], true).concat([{instance: null, method: finalHandler}])
}

/**
 * constructing route action which can be controller
 * method or a Closure binded as a callback
 *
 * @param  {Object}             resolvedRoute
 * @param  {String}             appNamespace
 * @return {Object}
 *
 * @private
 */
helpers.constructRouteAction = function (resolvedRoute, appNamespace) {
  if (typeof (resolvedRoute.handler) === 'function') {
    log.verbose('responding to route using closure')
    return {instance: null, method: resolvedRoute.handler}
  } else if (typeof (resolvedRoute.handler) === 'string') {
    return helpers.makeControllerMethod(appNamespace, resolvedRoute.handler)
  }
  throw new NE.InvalidArgumentException('Invalid route handler, attach a controller method or a closure', 500)
}

/**
 * making controller method from ioc container using it's complete namespace
 *
 * @param  {String}             appNamespace
 * @param  {String}             controllerMethod
 * @return {Object}
 *
 * @private
 */
helpers.makeControllerMethod = function (appNamespace, controllerMethod) {
  const controllerNamespace = `${appNamespace}/Http/Controllers`
  const handlerNamespace = `${controllerNamespace}/${controllerMethod.replace(controllerNamespace, '')}`
  return Ioc.makeFunc(handlerNamespace)
}

