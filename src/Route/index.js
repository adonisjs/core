'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const _ = require('lodash')

/**
 * holding reference to registered routes
 * @type {Array}
 * @private
 */
let routes = []

/**
 * holding reference to active Group
 * @type {String}
 * @private
 */
let activeGroup = null

/**
 * holding reference to subdomains
 * @type {Array}
 * @private
 */
let subdomains = []

/**
 * @module Route
 * @description Gives ability to bind http requests to
 * regular expression.
 */
let Route = exports = module.exports = {}

/**
 * @function routes
 * @description return registered routes with application
 * @return {Object}
 * @public
 */
Route.routes = function () {
  return routes
}

/**
 * @function new
 * @description clear registered routes and other local
 * variables
 * @public
 */
Route.new = function () {
  activeGroup = null
  routes = []
  subdomains = []
}

/**
 * @function route
 * @description register route with path,verb and handler
 * @param {string} route
 * @param {string} verb
 * @param {any} handler
 * @public
 */
Route.route = function (route, verb, handler) {
  let constructedRoute = helpers.construct(route, verb, handler, activeGroup)
  routes.push(constructedRoute)
}

/**
 * @function get
 * @description register route with GET verb
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.get = function (route, handler) {
  this.route(route, 'GET', handler)
  return this
}

/**
 * @function post
 * @description register route with POST verb
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.post = function (route, handler) {
  this.route(route, 'POST', handler)
  return this
}

/**
 * @function put
 * @description register route with PUT verb
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.put = function (route, handler) {
  this.route(route, 'PUT', handler)
  return this
}

/**
 * @function patch
 * @description register route with PATCH verb
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.patch = function (route, handler) {
  this.route(route, 'PATCH', handler)
  return this
}

/**
 * @function delete
 * @description register route with DELETE verb
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.delete = function (route, handler) {
  this.route(route, 'DELETE', handler)
  return this
}

/**
 * @function match
 * @description register route with array of verbs
 * passed while consuming
 * @param  {Array} verbs
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.match = function (verbs, route, handler) {
  verbs = _.map(verbs, function (verb) { return verb.toUpperCase() })
  this.route(route, verbs, handler)
  return this
}

/**
 * @function any
 * @description register route with array of verbs
 * @param  {Array} verbs
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.any = function (route, handler) {
  const verbs = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  this.route(route, verbs, handler)
  return this
}

/**
 * @function as
 * @description giving registered route as named route
 * @param  {String} name route name
 * @public
 */
Route.as = function (name) {
  let lastRoute = _.last(routes)
  if (lastRoute.route) {
    lastRoute.name = name
  }
  return this
}

/**
 * @function middlewares
 * @description assign array of named middlewares to route
 * @param  {Array} arrayOfNamedMiddleware
 * @public
 */
Route.middlewares = function (arrayOfNamedMiddleware) {
  /**
   * applying middlewares on a single route
   */
  if (!activeGroup) {
    let lastRoute = _.last(routes)
    if (lastRoute.route) {
      lastRoute.middlewares = arrayOfNamedMiddleware
    }
    return this
  }

  /**
   * applying middleware to a group of routes
   */
  routes = _.map(routes, function (route) {
    if (route.group === activeGroup) {
      route.middlewares = arrayOfNamedMiddleware
    }
    return route
  })

  return this
}

/**
 * @function group
 * @description create a new group of routes
 * @param  {String}   name
 * @param  {Function} cb
 * @public
 */
Route.group = function (name, cb) {
  activeGroup = name
  cb()
  return this
}

/**
 * @function prefix
 * @description prefix given group of routes
 * @param  {String} prefix
 * @public
 */
Route.prefix = function (prefix) {
  if (activeGroup) {
    routes = _.map(routes, function (route) {
      if (route.group === activeGroup) {
        route.route = prefix + route.route
        route.pattern = helpers.makeRoutePattern(route.route)
      }
      return route
    })
  }
  return this
}

/**
 * @function domain
 * @description set subdomain for a given group of routes
 * @param  {String} subdomain
 * @public
 */
Route.domain = function (subdomain) {
  if (activeGroup) {
    subdomains.push(helpers.makeRoutePattern(subdomain))
    _.each(routes, function (route) {
      if (route.group === activeGroup) {
        route.subdomain = subdomain
      }
    })
  }
  return this
}

/**
 * @function close
 * @description close previously opened Route group
 * @public
 */
Route.close = function () {
  activeGroup = null
}

/**
 * @function resolve
 * @description resolving route with given url and method
 * @param  {String} urlPath
 * @param  {String} verb
 * @return {Object}
 * @public
 */
Route.resolve = function (urlPath, verb, host) {
  if (helpers.isHostRegisteredAsSubdomain(subdomains, host)) {
    urlPath = `${host}${urlPath}`
  }
  let resolvedRoute = helpers.returnMatchingRouteToUrl(routes, urlPath, verb)
  if (_.size(resolvedRoute) === 0) return {}
  return helpers.returnRouteArguments(resolvedRoute, urlPath, host)
}

/**
 * @function resource
 * @description creates a resource of routes based out of conventions
 * @param  {String} pattern
 * @param  {String} handler
 * @public
 */
Route.resource = function (pattern, handler) {
  Route.get(pattern, `${handler}.index`)
  Route.post(pattern, `${handler}.store`)
  Route.get(`${pattern}/:id`, `${handler}.show`)
  Route.put(`${pattern}/:id`, `${handler}.update`)
  Route.delete(`${pattern}/:id`, `${handler}.destroy`)
}

/**
 * @function resource
 * @description form url based on route and params
 * @param  {String} pattern
 * @param  {Object} params
 * @return {String}
 * @public
 */
Route.url = function (pattern, params) {
  let result = null
  _.each(routes, function (route) {
    if (route.name === pattern) {
      const resolveRoute = route.subdomain ? `${route.subdomain}${route.route}` : route.route
      result = helpers.compileRouteToUrl(resolveRoute, params)
      return false
    }
  })
  if (!result) {
    result = helpers.compileRouteToUrl(pattern, params)
  }
  return result
}
