"use strict";

/**
 * @author      - Harminder Virk
 * @package     - Adonis app dispatcher
 * @description - Helper methods for adonis server
 */


let Middlewares = require("../Middlewares"),
  Static = require("../Static"),
  App = require("../App"),
  co = require("co"),
  Logger = require("../Logger"),
  HttpException = require("../HttpException"),
  Namespace = require("../Namespace"),
  _ = require("lodash");


// exporting helpers
let ServerHelpers = exports = module.exports = {};


/**
 * build final handler to be consumed by co-ware
 * @param  {Function} method
 * @param  {Object} request
 * @param  {Object} response
 * @return {Function}
 */
ServerHelpers.craft_final_handler = function(method, request, response) {
  return function*() {
    if (method.controller) {
      yield method.action.call(method.controller, request, response);
    } else {
      yield method.action(request, response);
    }
  }
}


/**
 * figure out where request is for favicon or not
 * @param  {String}  uri
 * @return {Boolean}
 */
ServerHelpers.is_favicon_request = function(uri) {
  return uri === '/favicon.ico';
}



/**
 * resolve and return handler attached to path using Router
 * @param  {Object} Router
 * @param  {String} uri
 * @param  {String} method
 * @return {Promise}
 */
ServerHelpers.resolve_and_return_handler = function(Router, uri, method) {
  let resolved_route = Router.resolve(uri, method);

  return new Promise(function(resolve, reject) {
    if (!resolved_route.handler) {
      reject({
        toStatic: true
      });
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
      if (typeof(resolved_route.handler) === 'string') {
        resolved_route.controller = ServerHelpers.namespace_to_controller_instance(resolved_route.handler);

        let namespaceHandler = resolved_route.controller.is_namespaced ? co.wrap(function*() {
          return yield Namespace.resolve(resolved_route.controller.controller)
        }) : co.wrap(function*() {
          return yield Namespace.resolve(resolved_route.controller.controller, "controllers")
        })

        namespaceHandler()
          .then(function(controller_instance) {
            resolved_route.controller.controller = controller_instance;
            resolved_route.controller.action = resolved_route.controller.controller[resolved_route.controller.action];
            resolve(resolved_route);
          })
          .catch(function(error) {
            reject(error);
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
          is_namespaced: false,
          controller: null,
          action: resolved_route.handler
        };
        resolve(resolved_route);
      }
    }
  });
}



/**
 * parse controller method string to build proper namespace ready
 * to be resolved via namespace store
 * @param  {String} handler
 * @return {Object}
 */
ServerHelpers.namespace_to_controller_instance = function(handler) {
  let is_namespaced = ServerHelpers.is_namespaced(handler),
    sections = handler.split("."),
    controller_namespace = [],
    action = null,
    x = 0,
    sections_count = _.size(sections);


  _.each(sections, function(section) {
    x++;
    if (x === sections_count) {
      action = section
    } else {
      controller_namespace.push(section);
    }
  });
  return {
    controller: controller_namespace.join("/"),
    action,
    is_namespaced
  };

}



/**
 * tells whether string is pre namespaced or not
 * @param  {String}  string
 * @return {Boolean}
 */
ServerHelpers.is_namespaced = function(string) {
  return _.includes(string, '/');
}



/**
 * handle errors occured during Http call , can be process errors or self thrown one's
 * @param  {Object} error
 * @param  {Object} request
 * @param  {Object} response
 */
ServerHelpers.handle_http_errors = function(error, request, response) {

  error.isHttpError = false;
  if (error instanceof HttpException) {
    error.isHttpError = true;
  }
  // counting app listeners
  let listeners = App.listeners('error').length;

  if (listeners > 0) {
    App.emit("error", error, request, response);
  } else {
    let error_message = error.isHttpError ? error.message : error.stack;
    let error_status = error.statusCode || 503;
    response.status(error_status).send(error_message).end();
    Logger.error(error_message);
  }

}



/**
 * register middlewares to Ware
 * @param  {Object} Ware
 * @param  {Array} named_middlewares
 */
ServerHelpers.register_request_middlewares = function(Ware, named_middlewares) {
  let middlewares = Middlewares.get(named_middlewares),
    filtered = Middlewares.filter(middlewares);

  _.each(filtered, function(instance) {
    Ware.use(instance);
  });
}


/**
 * finding whether request is for a static resource or not
 * @param  {String}  request_url
 * @return {Boolean}
 */
ServerHelpers.is_static_resource = function(request_url) {
  return Static.isStatic(request_url);
}


/**
 * handle request as a static resource using Static module
 * @param  {Object} request
 * @param  {Object} respons
 */
ServerHelpers.handle_as_static_resource = function(request, response) {
  request.request.url = Static.removePublicNamespace(request.request.url);
  Static.serve(request.request, response.response, function(error) {
    if (error) {
      ServerHelpers.handle_http_errors(error, request, response);
    }
  })
}


ServerHelpers.serve_favicon = function(request, response) {
  Static.serveFavicon(request.request, response.response);
}