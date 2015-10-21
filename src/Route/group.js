'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const subdomains = require('./subdomains')

/**
 * @class Group
 * @description Adds functionality to create group of routes and
 * keep code DRY.
 * @public
 */
class Group{

  constructor (routes) {
    this.routes = routes
  }

  /**
   * @description attach middleware to group of routes.
   * @method middlewares
   * @param  {Array}    arrayOfNamedMiddleware
   * @return {Object}                           reference to this for chaining
   * @public
   */
  middlewares (arrayOfNamedMiddleware) {
    helpers.appendMiddleware(this.routes, arrayOfNamedMiddleware)
    return this
  }

  /**
   * @description prefix group of routes
   * @method prefix
   * @param  {String} prefix
   * @return {Object}        reference to this for chaining
   */
  prefix (prefix) {
    helpers.prefixRoute(this.routes, prefix)
    return this
  }

  /**
   * @description add subdomain to group of routes
   * @method domain
   * @param  {String} subdomain
   * @return {Object}           reference to this for chaining
   */
  domain (subdomain) {
    subdomains.add(helpers.makeRoutePattern(subdomain))
    helpers.addSubdomain(this.routes, subdomain)
  }

}

module.exports = Group
