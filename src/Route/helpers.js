'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const pathToRegexp = require('path-to-regexp')
const _ = require('lodash')

let RouterHelper = exports = module.exports = {}

/**
 * @function construct
 * @description construct a new route using path-to-regexp
 * @param  {String}   route
 * @param  {String}   verb
 * @param  {Any}      handler
 * @return {Object}
 * @public
 */
RouterHelper.construct = function (route, verb, handler, group) {
  let pattern = RouterHelper.makeRoutePattern(route)
  let middlewares = []
  let subdomain = null
  let name = route

  verb = _.isArray(verb) ? verb : [verb] // a route can register for multiple verbs
  return {route, verb, handler, pattern, middlewares, name, group, subdomain}
}

/**
 * @function makeRoutePattern
 * @description make regex pattern for a given route
 * @param  {String} route
 * @return {Regex}
 * @public
 */
RouterHelper.makeRoutePattern = function (route) {
  return pathToRegexp(route, [])
}

/**
 * @function returnMatchingRouteToUrl
 * @description resolve route from routes store based upon current url
 * @param  {Object} routes
 * @param  {String} url
 * @param  {String} verb
 * @return {Object}
 * @public
 */
RouterHelper.returnMatchingRouteToUrl = function (routes, urlPath, verb) {
  let maps = _.filter(routes, function (route) {
    if (route.subdomain) {
      route.pattern = RouterHelper.makeRoutePattern(route.subdomain + route.route)
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
 * @function isHostRegisteredAsSubdomain
 * @description finding whether request current host is registered as a subdomain or not
 * @param  {Array}  subdomains
 * @param  {String}  host
 * @return {Boolean}
 */
RouterHelper.isHostRegisteredAsSubdomain = function (subdomains, host) {
  let is_subdomain = false
  for (let x = 0; x < subdomains.length; x++) {
    let subdomain = subdomains[x]
    if (subdomain.test(host)) {
      is_subdomain = true
      break
    }
  }
  return is_subdomain
}

/**
 * @function returnRouteArguments
 * @description return params passed to a given resolved route
 * @param  {Object} route
 * @param  {String} url
 * @return {Object}
 * @public
 */
RouterHelper.returnRouteArguments = function (route, urlPath) {
  let extracted = route.pattern.exec(urlPath)
  route.params = {}

  _.map(route.pattern.keys, function (key, index) {
    route.params[key.name] = extracted[index + 1]
  })
  return route
}

/**
 * @function compileRouteToUrl
 * @description return compiled url based on input route
 * @param  {String} route
 * @param  {Object} values
 * @return {String}
 * @public
 */
RouterHelper.compileRouteToUrl = function (route, values) {
  return pathToRegexp.compile(route)(values)
}
