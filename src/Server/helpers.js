'use strict'

/**
 * @author      - Harminder Virk
 * @package     - Adonis app dispatcher
 * @description - Helper methods for adonis server
 */

const Middlewares = require('../Middlewares')
const Static = require('../Static')
const App = require('../App')
const co = require('co')
const Logger = require('../Logger')
const HttpException = require('../HttpException')
const _ = require('lodash')
const Helpers = require('../Helpers')

// exporting helpers
let ServerHelpers = exports = module.exports = {}

/**
 * build final handler to be consumed by co-ware
 * @param  {Function} method
 * @param  {Object} request
 * @param  {Object} response
 * @return {Function}
 */
ServerHelpers.craft_final_handler = function (method, request, response) {
  let returned = null
  return function *() {
    if (method.controller) {
      returned = yield method.action.call(method.controller, request, response)
    } else {
      returned = yield method.action(request, response)
    }
    /**
     * if returned value is not undefined , set it as
     * response body
     */
    if (typeof(returned) !== 'undefined') {
      response.ok(returned)
    }
  }
}

/**
 * figure out where request is for favicon or not
 * @param  {String}  uri
 * @return {Boolean}
 */
ServerHelpers.is_favicon_request = function (uri) {
  return uri === '/favicon.ico'
}

/**
 * resolve and return handler attached to path using Router
 * @param  {Object} Router
 * @param  {String} uri
 * @param  {String} method
 * @return {Promise}
 */
ServerHelpers.resolve_and_return_handler = function (Router, uri, method) {
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

        resolved_route.controller = ServerHelpers.namespace_to_controller_instance(resolved_route.handler)

        let namespaceHandler = co.wrap(function *() {
          return yield make(resolved_route.controller.controller)
        })

        namespaceHandler()
          .then(function (controller_instance) {
            resolved_route.controller.controller = controller_instance
            resolved_route.controller.action = resolved_route.controller.controller[resolved_route.controller.action]
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
 * parse controller method string to build proper namespace ready
 * to be resolved via namespace store
 * @param  {String} handler
 * @return {Object}
 */
ServerHelpers.namespace_to_controller_instance = function (handler) {
  let sections = handler.split('.')
  const baseNamespace = Helpers.appNameSpace()
  const controllerNamespace = `${baseNamespace}/Http/Controllers`
  if(sections.length !== 2){
    throw new HttpException(503,`${handler} is not a readable controller action`)
  }
  let controller = sections[0].replace(controllerNamespace,'')
  controller = `${controllerNamespace}/${controller}`.replace(/\/\//g,'/')
  const action = sections[1]
  return {controller, action}
}

/**
 * handle errors occured during Http call , can be process errors or self thrown one's
 * @param  {Object} error
 * @param  {Object} request
 * @param  {Object} response
 */
ServerHelpers.handle_http_errors = function (error, request, response) {
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
 * register middlewares to Ware
 * @param  {Object} Ware
 * @param  {Array} named_middlewares
 */
ServerHelpers.register_request_middlewares = function (Ware, named_middlewares) {
  let middlewares = Middlewares.get(named_middlewares)
  _.each(middlewares, function (middleware) {
    Ware.use(middleware)
  })
}

/**
 * finding whether request is for a static resource or not
 * @param  {String}  request_url
 * @return {Boolean}
 */
ServerHelpers.is_static_resource = function (request_url) {
  return Static.isStatic(request_url)
}

/**
 * handle request as a static resource using Static module
 * @param  {Object} request
 * @param  {Object} respons
 */
ServerHelpers.handle_as_static_resource = function (request, response) {
  request.request.url = Static.removePublicNamespace(request.request.url)
  Static.serve(request.request, response.response, function (error) {
    if (error) {
      ServerHelpers.handle_http_errors(error, request, response)
    }
  })
}

/**
 * servers favicon from registered path
 * @param  {Object} request
 * @param  {Object} response
 */
ServerHelpers.serve_favicon = function (request, response) {
  Static.serveFavicon(request.request, response.response)
}
