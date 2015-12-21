'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const co = require('co')
const App = require('../App')
const Ioc = require('adonis-fold').Ioc

/**
 * @module helpers
 * @type {Object}
 */
/*jshint -W120 */
let helpers = exports = module.exports = {}

/**
 * @description calls request route handler by setting up middleware
 * layer
 * @method callRouteAction
 * @param  {Object}         resolvedRoute
 * @param  {Object}         request
 * @param  {Object}         response
 * @param  {Object}         middleware
 * @param  {String}         appNamespace
 * @return {void}
 */
helpers.callRouteAction = function (resolvedRoute, request, response, middleware, appNamespace) {
  co(function * () {
    /**
     * resolving route middleware if any, middleware.resolve tends
     * to throw errors bubbled by IoC container
     * @type {Array}
     */
    let routeMiddleware = middleware.resolve(middleware.filter(resolvedRoute.middlewares, false))

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
 * @description responds to an http request by calling all global
 * middleware and finally executing finalHandler
 * @method respondRequest
 * @param  {Object}       middleware   [description]
 * @param  {Object}       request      [description]
 * @param  {Object}       response     [description]
 * @param  {Function}       finalHandler [description]
 * @return {void}                    [description]
 * @public
 */
helpers.respondRequest = function (middleware, request, response, finalHandler) {
  co(function * () {
    /**
     * here we resolve all global middleware and compose
     * them
     * @type {Array}
     */
    let routeMiddleware = middleware.resolve(middleware.getGlobal())
    routeMiddleware = routeMiddleware.concat([{instance: null,method: finalHandler}])
    yield middleware.compose(routeMiddleware, request, response)
  }).catch(function (e) {
    helpers.handleRequestError(e, request, response)
  })
}

/**
 * @description constructing route action which can be controller
 * method or a Closure binded as a callback
 * @method constructRouteAction
 * @param  {Object}             resolvedRoute [description]
 * @param  {String}             appNamespace  [description]
 * @return {Object}                           [description]
 * @public
 * @throws {Invalid route handler} If Route handler is not function or valid controller
 * method.
 */
helpers.constructRouteAction = function (resolvedRoute, appNamespace) {
  if (typeof (resolvedRoute.handler) === 'function') {
    log.verbose('responding to route using closure')
    return {instance: null,method: resolvedRoute.handler}
  }
  else if (typeof (resolvedRoute.handler) === 'string') {
    return helpers.makeControllerMethod(appNamespace, resolvedRoute.handler)
  }
  throw new Error('Invalid route handler , attach a controller method or a closure')
}

/**
 * @description making controller method from ioc container using it's complete namespace
 * @method makeControllerMethod
 * @param  {String}             appNamespace
 * @param  {String}             controllerMethod
 * @return {Object}
 * @public
 */
helpers.makeControllerMethod = function (appNamespace, controllerMethod) {
  const controllerNamespace = `${appNamespace}/Http/Controllers`
  const handlerNamespace = `${controllerNamespace}/${controllerMethod.replace(controllerNamespace, '')}`
  return Ioc.makeFunc(handlerNamespace)
}

/**
 * @description  sending error back to http client
 * @method handleRequestError
 * @param  {Object}           error
 * @param  {Object}           response
 * @return {void}
 * @public
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
