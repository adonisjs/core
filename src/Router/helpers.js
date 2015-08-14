'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Helper methods for adonis router
 */

// importing libraries
const pathToRegexp = require('path-to-regexp'),
  _ = require('lodash')

// exporting Helpers
let RouterHelper = exports = module.exports = {}

/**
 * construct a new route using path-to-regexp
 * @param  {String}   route   
 * @param  {String}   verb
 * @param  {Any}      handler
 * @return {Object}
 */
RouterHelper.construct = function (route, verb, handler, group) {
  let pattern = RouterHelper.make_route_pattern(route),
    middlewares = [],
    subdomain = null,
    name = route

  verb = _.isArray(verb) ? verb : [verb] // a route can register for multiple verbs
  return {
  route, verb, handler, pattern, middlewares, name, group, subdomain}
}

/**
 * make regex pattern for a given route
 * @param  {String} route
 * @return {Regex}
 */
RouterHelper.make_route_pattern = function (route) {
  return pathToRegexp(route, [])
}

/**
 * resolve route from routes store based upon current url
 * @param  {Object} routes
 * @param  {String} url   
 * @param  {String} verb  
 * @return {Object}        
 */
RouterHelper.return_matching_route_to_url = function (routes, urlPath, verb) {
  let maps = _.filter(routes, function (route) {
    if (route.subdomain) {
      route.pattern = RouterHelper.make_route_pattern(route.subdomain + route.route)
    }
    return (route.pattern.test(urlPath) && _.includes(route.verb, verb))
  })
  maps = maps[0] || {}
  if (maps.verb) {
    maps.verb = verb
  } // replace array of verbs with matched verb
  return maps
}

/**
 * finding whether request current host is registered as a subdomain or not
 * @param  {Array}  subdomains
 * @param  {String}  host
 * @return {Boolean}
 */
RouterHelper.is_host_registered_as_subdomain = function (subdomains, host) {
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
 * return params passed to a given resolved route
 * @param  {Object} route
 * @param  {String} url
 * @return {Object}
 */
RouterHelper.return_route_arguments = function (route, urlPath) {
  let extracted = route.pattern.exec(urlPath)
  route.params = {}

  _.map(route.pattern.keys, function (key, index) {
    route.params[key.name] = extracted[index + 1]
  })
  return route
}

/**
 * return compiled url based on input route
 * @param  {String} route
 * @param  {Object} values
 * @return {String}
 */
RouterHelper.compile_route_to_url = function (route, values) {
  return pathToRegexp.compile(route)(values)
}
