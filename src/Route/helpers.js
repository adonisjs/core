'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const pathToRegexp = require('path-to-regexp')
const _ = require('lodash')

let RouterHelper = exports = module.exports = {}

/**
 * construct a new route using path-to-regexp
 *
 * @param  {String}   route
 * @param  {String}   verb
 * @param  {Any}      handler
 *
 * @return {Object}
 * @private
 */
RouterHelper.construct = function (route, verb, handler, group) {
  route = route.startsWith('/') ? route : `/${route}`
  const pattern = RouterHelper.makeRoutePattern(route)
  const middlewares = []
  const domain = null
  const name = route

  verb = _.isArray(verb) ? verb : [verb] // a route can register for multiple verbs
  return {route, verb, handler, pattern, middlewares, name, group, domain}
}

/**
 * make regex pattern for a given route
 *
 * @param  {String} route
 * @return {Regex}
 *
 * @private
 */
RouterHelper.makeRoutePattern = function (route) {
  return pathToRegexp(route, [])
}

/**
 * resolve route from routes store based upon current url
 *
 * @param  {Object} routes
 * @param  {String} url
 * @param  {String} verb
 * @return {Object}
 *
 * @private
 */
RouterHelper.returnMatchingRouteToUrl = function (routes, urlPath, verb) {
  let maps = _.filter(routes, function (route) {
    if (route.domain) {
      route.pattern = RouterHelper.makeRoutePattern(route.domain + route.route)
    }
    return (route.pattern.test(urlPath) && _.includes(route.verb, verb))
  })
  maps = maps[0] || {}
  if (maps.verb) {
    maps.matchedVerb = verb
  } // define which verb has been matched while resolving route
  return maps
}

/**
 * return params passed to a given resolved route
 *
 * @param  {Object} route
 * @param  {String} urlPath
 * @return {Object}
 *
 * @private
 */
RouterHelper.returnRouteArguments = function (route, urlPath) {
  const routeShallowCopy = _.clone(route)
  let extracted = routeShallowCopy.pattern.exec(urlPath)
  routeShallowCopy.params = {}

  _.map(routeShallowCopy.pattern.keys, function (key, index) {
    routeShallowCopy.params[key.name] = extracted[index + 1]
  })
  return routeShallowCopy
}

/**
 * return compiled url based on input route
 *
 * @param  {String} route
 * @param  {Object} values
 * @return {String}
 *
 * @private
 */
RouterHelper.compileRouteToUrl = function (route, values) {
  return pathToRegexp.compile(route)(values)
}

/**
 * general purpose method to append new middlewares to
 * a route or group of routes
 * @method appendMiddleware
 * @param  {Array|Object}         routes
 * @param  {Array}         middlewares
 * @return {void}
 * @private
 */
RouterHelper.appendMiddleware = function (routes, middlewares) {
  if (_.isArray(routes)) {
    _.each(routes, function (route) {
      route.middlewares = route.middlewares.concat(middlewares)
    })
  } else {
    routes.middlewares = routes.middlewares.concat(middlewares)
  }
}

/**
 * adds formats to routes or an array of routes
 *
 * @param  {Array|Object}   routes
 * @param  {Boolean}   strict
 * @param  {void}   format
 * @private
 */
RouterHelper.addFormats = function (routes, formats, strict) {
  const flag = strict ? '' : '?'
  const formatsPattern = `:format(.${formats.join('|.')})${flag}`
  if (_.isArray(routes)) {
    _.each(routes, function (route) {
      route.route = `${route.route}${formatsPattern}`
      route.pattern = RouterHelper.makeRoutePattern(route.route)
    })
  } else {
    routes.route = `${routes.route}${formatsPattern}`
    routes.pattern = RouterHelper.makeRoutePattern(routes.route)
  }
}

/**
 * general purpose method to prefix group of routes
 *
 * @param  {Array}    routes
 * @param  {String}    prefix
 * @return {void}
 *
 * @private
 */
RouterHelper.prefixRoute = function (routes, prefix) {
  _.each(routes, function (route) {
    route.route = route.route === '/' ? prefix : prefix + route.route
    route.pattern = RouterHelper.makeRoutePattern(route.route)
    return route
  })
}

/**
 * adds domain to group of routes.
 *
 * @param  {Array}     routes
 * @param  {String}     domain
 *
 * @private
 */
RouterHelper.addDomain = function (routes, domain) {
  _.each(routes, function (route) {
    route.domain = domain
  })
}
