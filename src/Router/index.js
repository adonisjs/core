'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Router for adonis app
 */

// Importing helpers
const helpers = require('./helpers')
const _ = require('lodash')

/**
 * holding reference to registered routes
 * @type {Array}
 */
let routes = []

/**
 * holding reference to active Group
 * @type {String}
 */
let activeGroup = null

/**
 * holding reference to subdomains
 * @type {Array}
 */
let subdomains = []

/**
 * @module Router
 */
let Router = exports = module.exports = {}

/**
 * return registered routes with application
 * @name routes
 * @return {Object}
 */
Router.routes = function () {
  return routes
}

/**
 * clear registered routes, almost like new instance of class
 * @name new
 */
Router.new = function () {
  routes = []
}

/**
 * register route with path,verb and handler
 * @name  route
 * @param {string} route
 * @param {string} verb
 * @param {any} handler
 */
Router.route = function (route, verb, handler) {
  let constructedRoute = helpers.construct(route, verb, handler, activeGroup)
  routes.push(constructedRoute)
}

/**
 * register route with GET verb
 * @param  {String} route
 * @param  {Any} handler
 */
Router.get = function (route, handler) {
  this.route(route, 'GET', handler)
  return this
}

/**
 * register route with POST verb
 * @param  {String} route
 * @param  {Any} handler
 */
Router.post = function (route, handler) {
  this.route(route, 'POST', handler)
  return this
}

/**
 * register route with PUT verb
 * @param  {String} route
 * @param  {Any} handler
 */
Router.put = function (route, handler) {
  this.route(route, 'PUT', handler)
  return this
}

/**
 * register route with PATCH verb
 * @param  {String} route
 * @param  {Any} handler
 */
Router.patch = function (route, handler) {
  this.route(route, 'PATCH', handler)
  return this
}

/**
 * register route with DELETE verb
 * @param  {String} route
 * @param  {Any} handler
 */
Router.delete = function (route, handler) {
  this.route(route, 'DELETE', handler)
  return this
}

/**
 * register route with array of verbs
 * passed while consuming
 * @param  {Array} verbs
 * @param  {String} route
 * @param  {Any} handler
 */
Router.match = function (verbs, route, handler) {
  verbs = _.map(verbs, function (verb) { return verb.toUpperCase() })
  this.route(route, verbs, handler)
  return this
}

/**
 * register route with array of verbs
 * @param  {Array} verbs
 * @param  {String} route
 * @param  {Any} handler
 */
Router.any = function (route, handler) {
  const verbs = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  this.route(route, verbs, handler)
  return this
}

/**
 * giving registered route as named route
 * @param  {String} name route name
 */
Router.as = function (name) {
  let lastRoute = _.last(routes)
  if (lastRoute.route) {
    lastRoute.name = name
  }
  return this
}

/**
 * assign array of named middlewares to route
 * @param  {Array} array_of_named_middlewares
 */
Router.middlewares = function (array_of_named_middlewares) {
  /**
   * applying middlewares on a single route
   */
  if (!activeGroup) {
    let lastRoute = _.last(routes)
    if (lastRoute.route) {
      lastRoute.middlewares = array_of_named_middlewares
    }
    return this
  }

  /**
   * applying middlewares to a group of routes
   */
  routes = _.map(routes, function (route) {
    if (route.group === activeGroup) {
      route.middlewares = array_of_named_middlewares
    }
    return route
  })

  return this

}

/**
 * create a new group of routes
 * @param  {String}   name
 * @param  {Function} cb
 */
Router.group = function (name, cb) {
  activeGroup = name
  cb()
  return this
}

/**
 * prefix given group of routes
 * @param  {String} prefix
 */
Router.prefix = function (prefix) {
  if (activeGroup) {
    routes = _.map(routes, function (route) {
      if (route.group === activeGroup) {
        route.route = prefix + route.route
        route.pattern = helpers.make_route_pattern(route.route)
      }
      return route
    })
  }
  return this
}

/**
 * set subdomain for a given group of routes
 * @param  {String} subdomain
 */
Router.domain = function (subdomain) {
  if (activeGroup) {
    subdomains.push(helpers.make_route_pattern(subdomain))
    _.each(routes, function (route) {
      if (route.group === activeGroup) {
        route.subdomain = subdomain
      }
    })
  }
  return this
}

/**
 * close previously opened router group
 */
Router.close = function () {
  activeGroup = null
}

/**
 * resolving route with given url and method
 * @param  {String} urlPath
 * @param  {String} verb
 * @return {Object}
 */
Router.resolve = function (urlPath, verb, host) {
  if (helpers.is_host_registered_as_subdomain(subdomains, host)) {
    urlPath = `${host}${urlPath}`
  }
  let resolvedRoute = helpers.return_matching_route_to_url(routes, urlPath, verb)
  if (_.size(resolvedRoute) === 0) return {}
  return helpers.return_route_arguments(resolvedRoute, urlPath, host)
}

/**
 * creates a resource of routes based out of conventions
 * @param  {String} pattern
 * @param  {String} handler
 */
Router.resource = function (pattern, handler) {
  Router.get(pattern, `${handler}.index`)
  Router.post(pattern, `${handler}.store`)
  Router.get(`${pattern}/:id`, `${handler}.show`)
  Router.put(`${pattern}/:id`, `${handler}.update`)
  Router.delete(`${pattern}/:id`, `${handler}.destroy`)
}

/**
 * form url based on route and params
 * @param  {String} pattern
 * @param  {Object} params
 * @return {String}
 */
Router.url = function (pattern, params) {
  let result = null
  _.each(routes, function (route) {
    if (route.name === pattern) {
      result = helpers.compile_route_to_url(route.route, params)
      return false
    }
  })
  if (!result) {
    result = helpers.compile_route_to_url(pattern, params)
  }
  return result
}
