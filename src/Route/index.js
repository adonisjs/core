'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const Group = require('./group')
const Resource = require('./resource')
const subdomains = require('./subdomains')
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

let Route = exports = module.exports = {}

/**
 * @description return registered routes with application
 * @method routes
 * @return {Object}
 * @public
 */
Route.routes = function () {
  return routes
}

/**
 * @description clear registered routes and other local
 * @method new
 * variables
 * @public
 */
Route.new = function () {
  activeGroup = null
  routes = []
}

/**
 * @description register route with path,verb and handler
 * @method route
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
 * @description register route with GET verb
 * @method get
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.get = function (route, handler) {
  this.route(route, ['GET', 'HEAD'], handler)
  return this
}

/**
 * @description register route with POST verb
 * @method post
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.post = function (route, handler) {
  this.route(route, 'POST', handler)
  return this
}

/**
 * @description register route with PUT verb
 * @method put
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.put = function (route, handler) {
  this.route(route, 'PUT', handler)
  return this
}

/**
 * @description register route with PATCH verb
 * @method patch
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.patch = function (route, handler) {
  this.route(route, 'PATCH', handler)
  return this
}

/**
 * @description register route with DELETE verb
 * @method delete
 * @param  {String} route
 * @param  {Any} handler
 * @return {Object}
 * @public
 */
Route.delete = function (route, handler) {
  this.route(route, 'DELETE', handler)
  return this
}

/**
 * @description register route with OPTIONS verb
 * @method options
 * @param  {String} route
 * @param  {Mixed} handler
 * @return {Object}
 * @public
 */
Route.options = function (route, handler) {
  this.route(route, 'OPTIONS', handler)
  return this
}

/**
 * @description register route with array of verbs
 * @method match
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
 * @description register route with array of verbs
 * @method any
 * @param  {Array} verbs
 * @param  {String} route
 * @param  {Any} handler
 * @public
 */
Route.any = function (route, handler) {
  const verbs = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  this.route(route, verbs, handler)
  return this
}

/**
 * @method as
 * @description giving registered route as named route
 * @param  {String} name route name
 * @public
 */
Route.as = function (name) {
  let lastRoute = Route.lastRoute()
  lastRoute.name = name
  return this
}

/**
 * @description returns last route registered inside
 * the route store
 * @method lastRoute
 * @return {Object}
 * @public
 */
Route.lastRoute = function () {
  return _.last(routes)
}

/**
 * @description assign array of named middlewares to route
 * @method middlewares
 * @param  {Array} arrayOfNamedMiddleware
 * @public
 */
Route.middlewares = function (arrayOfNamedMiddleware) {
  let lastRoute = Route.lastRoute()
  helpers.appendMiddleware(lastRoute, arrayOfNamedMiddleware)
  return this
}

/**
 * @description create a new group of routes
 * @method group
 * @param  {String}   name
 * @param  {Function} cb
 * @public
 */
Route.group = function (name, cb) {
  activeGroup = name
  cb()
  const groupRoutes = _.filter(routes, function (route) {
    return route.group === activeGroup
  })
  activeGroup = null
  return new Group(groupRoutes)
}

/**
 * @description resolving route with given url and method
 * @method resolve
 * @param  {String} urlPath
 * @param  {String} verb
 * @return {Object}
 * @public
 */
Route.resolve = function (urlPath, verb, host) {
  if (subdomains.match(host)) {
    urlPath = `${host}${urlPath}`
  }
  let resolvedRoute = helpers.returnMatchingRouteToUrl(routes, urlPath, verb)
  if (_.size(resolvedRoute) === 0) {
    return {}
  }
  return helpers.returnRouteArguments(resolvedRoute, urlPath, host)
}

/**
 * @description creates a resource of routes based out of conventions
 * @method resource
 * @param  {String} pattern
 * @param  {String} handler
 * @public
 */
Route.resource = function (pattern, handler) {
  return new Resource(Route, pattern, handler)
}

/**
 * @description form url based on route and params
 * @method resource
 * @param  {String} pattern
 * @param  {Object} params
 * @return {String}
 * @public
 */
Route.url = function (pattern, params) {
  const namedRoute = _.filter(routes, function (route) {
    return route.name === pattern
  })[0]

  /**
   * if found pattern as a named route, make it using
   * route properties
   */
  if (namedRoute) {
    const resolveRoute = namedRoute.subdomain ? `${namedRoute.subdomain}${namedRoute.route}` : namedRoute.route
    return helpers.compileRouteToUrl(resolveRoute, params)
  }
  return helpers.compileRouteToUrl(pattern, params)
}

/**
 * @description removes a route using it's name
 * @method remove
 * @param  {String} name
 * @return {void}
 * @public
 */
Route.remove = function (name) {
  const index = _.findIndex(routes, {name})
  routes.splice(index, 1)
}
