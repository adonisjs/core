'use strict'

/**
 * @author      - Harminder Virk
 * @package     - Adonis app dispatcher
 * @description - Helper methods for adonis server
 */

const Middleware = require('../Middleware')
const Static = require('../Static')
const App = require('../App')
const Ioc = require('adonis-fold').Ioc
const co = require('co')
const Logger = require('../Logger')
const HttpException = require('../HttpException')
const _ = require('lodash')
const Helpers = require('../Helpers')

// exporting helpers
let ServerHelpers = exports = module.exports = {}

/**
 * @function craftFinalHandler
 * @description calls route controller method or closure and
 * returns a generator to be find inside co-ware
 * @param  {Function} method
 * @param  {Object} request
 * @param  {Object} response
 * @return {Function}
 * @public
 */
ServerHelpers.craftFinalHandler = function (method, request, response) {
  let returned = null
  return function *() {
    if (method.instance) {
      returned = yield method.action.call(method.instance, request, response)
    } else {
      returned = yield method.action(request, response)
    }
    /**
     * if returned value is not undefined , set it as
     * response body
     */
    if (typeof (returned) !== 'undefined') {
      response.ok(returned)
    }
  }
}

/**
 * @function isFaviconRequest
 * @description figure out whether request is for favicon or not
 * @param  {String}  uri
 * @return {Boolean}
 * @public
 */
ServerHelpers.isFaviconRequest = function (uri) {
  return uri === '/favicon.ico'
}

/**
 * @function resolveAndReturnHandler
 * @description resolve and return handler attached to path using Route provider
 * @param  {Object} Router
 * @param  {String} uri
 * @param  {String} method
 * @return {Promise}
 * @public
 */
ServerHelpers.resolveAndReturnHandler = function (Router, uri, method) {
  let resolved_route = Router.resolve(uri, method)

  return new Promise(function (resolve, reject) {
    if (!resolved_route.handler) {
      throw new HttpException(404, 'Route not found')
    } else {
      /**
       * ----------------------------
       * DOING LOT OF WORK HERE
       * ----------------------------
       * If router handler is a string then
       *   1). Controller string to a proper namespace and find whether
       *       controller is pre namespaced or not
       *   2). Resolve controller from Namespace factory and get
       *       instance to controller class
       *   3). Finally return an object with controller instance and
       *       controller method.
       */
      if (typeof (resolved_route.handler) === 'string') {
        const controllerNamespace = ServerHelpers.namespaceToControllerInstance(resolved_route.handler)

        /**
         * here we make sure that if controller has been resolved out of Ioc container
         * we should not re-resolve it and use the old instance , if same request
         * is coming again. It works only if same controller is called in
         * sequence by multiple requests.
         */
        if (resolved_route.controller && resolved_route.controller.resolved && resolved_route.controller.namespace === controllerNamespace.namespace) {
          resolved_route.controller.action = controllerNamespace.action
          if (!resolved_route.controller.instance[resolved_route.controller.action]) {
            reject(new Error(`method ${resolved_route.controller.action} does not exists on ${resolved_route.controller.namespace}`))
          }
          resolved_route.controller.action = resolved_route.controller.instance[resolved_route.controller.action]
          resolve(resolved_route)
          return
        }

        /**
         * here we do not have the old instance of controller so better get it from IOC container
         */
        resolved_route.controller = controllerNamespace
        let namespaceHandler = co.wrap(function *() {
          return yield Ioc.make(resolved_route.controller.namespace)
        })

        namespaceHandler()
          .then(function (controller_instance) {
            resolved_route.controller.instance = controller_instance
            if (!resolved_route.controller.instance[resolved_route.controller.action]) {
              reject(new Error(`method ${resolved_route.controller.action} does not exists on ${resolved_route.controller.namespace}`))
            }
            resolved_route.controller.action = resolved_route.controller.instance[resolved_route.controller.action]
            resolved_route.controller.resolved = true
            resolve(resolved_route)
          })
          .catch(function (error) {
            reject(error)
          })
      } else {
        /**
         * ----------------------------
         * DOING LOT OF WORK HERE
         * ----------------------------
         * else
         *   1). If not string controller will be a function so should
         *       be called directly without any extra effort.
         *   2). As return interface of methods needs to be same we
         *       will assign null values to non-required keys.
         */
        resolved_route.controller = {
          controller: null,
          action: resolved_route.handler
        }
        resolve(resolved_route)
      }
    }
  })
}

/**
 * @function namespaceToControllerInstance
 * @description parse controller method string to build proper namespace ready
 * to be resolved via namespace store
 * @param  {String} handler
 * @return {Object}
 * @public
 */
ServerHelpers.namespaceToControllerInstance = function (handler) {
  let sections = handler.split('.')
  const baseNamespace = Helpers.appNameSpace()
  const controllerNamespace = `${baseNamespace}/Http/Controllers`
  if (sections.length !== 2) {
    throw new HttpException(503, `${handler} is not a readable controller action`)
  }
  let namespace = sections[0].replace(controllerNamespace, '')
  namespace = `${controllerNamespace}/${namespace}`.replace(/\/\//g, '/')
  const action = sections[1]
  return {namespace, action}
}

/**
 * @function handleHttpErrors
 * @description handle errors occured during Http call , emit an
 * event if there are any listeners , otherwise make and send
 * error using response object.
 * @param  {Object} error
 * @param  {Object} request
 * @param  {Object} response
 * @public
 */
ServerHelpers.handleHttpErrors = function (error, request, response) {
  error.isHttpError = false
  if (error instanceof HttpException) {
    error.isHttpError = true
  }

  // counting app listeners
  let listeners = App.listeners('error').length

  if (listeners > 0) {
    App.emit('error', error, request, response)
  } else {
    let error_message = error.isHttpError || !error.stack ? error.message : error.stack
    let error_status = error.status || 503
    response.status(error_status).send(error_message).end()
    Logger.error(error_message)
  }
}

/**
 * @function registerRequestMiddleware
 * @description register Middleware to co-ware
 * @param  {Object} Ware
 * @param  {Array} named_Middleware
 * @public
 */
ServerHelpers.registerRequestMiddleware = function (Ware, namedMiddleware) {
  let registerMiddleware = Middleware.get(namedMiddleware)
  _.each(registerMiddleware, function (middleware) {
    Ware.use(middleware)
  })
}

/**
 * @function isStaticResource
 * @description see whether request is for a static resource or not
 * @param  {String}  request_url
 * @return {Boolean}
 * @public
 */
ServerHelpers.isStaticResource = function (request_url) {
  return Static.isStatic(request_url)
}

/**
 * @function handleAsStaticResource
 * @description handle request as a static resource using Static module
 * @param  {Object} request
 * @param  {Object} respons
 * @public
 */
ServerHelpers.handleAsStaticResource = function (request, response) {
  request.request.url = Static.removePublicNamespace(request.request.url)
  Static.serve(request.request, response.response, function (error) {
    if (error) {
      ServerHelpers.handleHttpErrors(error, request, response)
    }
  })
}

/**
 * @function serveFavicon
 * @description servers favicon from registered path
 * @param  {Object} request
 * @param  {Object} response
 * @public
 */
ServerHelpers.serveFavicon = function (request, response) {
  Static.serveFavicon(request.request, response.response)
}
