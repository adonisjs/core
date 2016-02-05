'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const co = require('co')
const App = require('../App')
const Ioc = require('adonis-fold').Ioc
const NE = require('node-exceptions')

let helpers = exports = module.exports = {}

/**
 * calls request route handler by setting up middleware
 * layer
 *
 * @param  {Object}         resolvedRoute
 * @param  {Object}         request
 * @param  {Object}         response
 * @param  {Object}         middleware
 * @param  {String}         appNamespace
 *
 * @private
 *
 */
helpers.callRouteAction = function (resolvedRoute, request, response, middleware, appNamespace) {
  co(function * () {
    /**
     * resolving route middleware if any, middleware.resolve tends
     * to throw errors bubbled by IoC container
     * @type {Array}
     */
    let routeMiddleware = middleware.resolve(middleware.formatNamedMiddleware(resolvedRoute.middlewares), false)

    /**
     * making route action, which can a controller method or
     * can be a closure.
     * @type {Object}
     */
    const routeAction = helpers.constructRouteAction(resolvedRoute, appNamespace)
    routeMiddleware = routeMiddleware.concat([routeAction])

    /**
     * composing all middleware with route action
     */
    yield middleware.compose(routeMiddleware, request, response)
  }).catch(function (e) {
    helpers.handleRequestError(e, request, response)
  })
}

/**
 * responds to an http request by calling all global
 * middleware and finally executing finalHandler
 *
 * @param  {Object}       middleware
 * @param  {Object}       request
 * @param  {Object}       response
 * @param  {Function}       finalHandler
 * @return {void}
 *
 * @private
 */
helpers.respondRequest = function (middleware, request, response, finalHandler) {
  co(function * () {
    /**
     * here we resolve all global middleware and compose
     * them
     * @type {Array}
     */
    const routeMiddleware = middleware.resolve([], true).concat([{instance: null, method: finalHandler}])
    yield middleware.compose(routeMiddleware, request, response)
  }).catch(function (e) {
    helpers.handleRequestError(e, request, response)
  })
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
  throw new NE.InvalidArgumentException('Invalid route handler, attach a controller method or a closure')
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

/**
 * sending error back to http client
 *
 * @param  {Object}           error
 * @param  {Object}           response
 * @return {void}
 *
 * @private
 */
helpers.handleRequestError = function (error, request, response) {
  /**
   * if we have any listeners for error events, we will emit
   * the error only and will let the listeners make the
   * decision of how to display those errors.
   */
  const errorListeners = App.listeners('error').length
  if (errorListeners > 0) {
    App.emit('error', error, request, response)
    return
  }

  const message = error.message || 'Internal server error'
  const status = error.status || 500
  const stack = error.stack || message
  log.error(stack)
  response.status(status).send(stack)
}
