'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const co = require('co')
const Ioc = require('adonis-fold').Ioc

let helpers = exports = module.exports = {}

helpers.callRouteHandler = function (resolvedRoute, request, response, middleware, debug, appNamespace) {

  let routeMiddleware = []
  try{
    routeMiddleware = middleware.resolve(middleware.filter(resolvedRoute.middlewares,true))
  }catch(e){
    helpers.handleRequestError(e, response)
    return
  }

  /**
   * if route handler is a controller method resolve it from
   * ioc.
   */
  if(typeof(resolvedRoute.handler) === 'string'){
    debug('responding to route using controller method')

    co (function * () {
      const controllerMethod = helpers.makeControllerMethod(appNamespace, resolvedRoute.handler)
      routeMiddleware = routeMiddleware.concat([controllerMethod])
      yield middleware.compose(routeMiddleware, request, response)
    }).catch(function (e) {
      helpers.handleRequestError(e, response)
    })
    return
  }

  /**
   * if request handler is a closure, call it directly
  */
  if (typeof(resolvedRoute.handler) === 'function'){
    debug('responding to route using closure')
    co (function * () {
      routeMiddleware = routeMiddleware.concat([{instance:null,method:resolvedRoute.handler}])
      yield middleware.compose(routeMiddleware, request, response)
    }).catch(function (e) {
      helpers.handleRequestError(e, response)
    })
    return
  }

  /**
   * otherwise throw an error , as we have no idea on to call
   * this type of route handler.
   */
  helpers.handleRequestError(new Error('Invalid route handler , attach a controller method or a closure'), response)
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
helpers.handleRequestError = function (error, response) {
  const message = error.message || 'Internal server error'
  const status = error.status || 500
  response.status(status).send(message)
}

helpers.staticResourceDone = function (err, response) {
  if(err){
    helpers.handleRequestError(err, response)
    return
  }
}
