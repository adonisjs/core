'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const helpers = require('./helpers')
const domains = require('./domains')
const util = require('../../lib/util')

/**
 * Route groups to keep configuration DRY for bunch of
 * routes.
 * @class
 * @alias Route.Group
 */
class Group {

  constructor (routes) {
    this.routes = routes
  }

  /**
   * @see module:Route~middlewares
   */
  middlewares () {
    helpers.appendMiddleware(
      this.routes,
      util.spread.apply(this, arguments)
    )
    return this
  }

  /**
   * @see module:Route~middleware
   */
  middleware () {
    return this.middlewares.apply(this, arguments)
  }

  /**
   * prefix group of routes with a given pattern
   *
   * @param  {String} pattern
   *
   * @return {Object} - reference to this for chaining
   *
   * @example
   * Route.group('...').prefix('/v1')
   *
   * @public
   */
  prefix (pattern) {
    helpers.prefixRoute(this.routes, pattern)
    return this
  }

  /**
   * add domain to group of routes. All routes inside the group
   * will be matched on define domain
   *
   * @param  {String} domain
   * @return {Object} - reference to this for chaining
   *
   * @example
   * Route.group('...').domain(':user.example.com')
   *
   * @public
   */
  domain (domain) {
    domains.add(helpers.makeRoutePattern(domain))
    helpers.addDomain(this.routes, domain)
  }

  /**
   * @see module:Route~formats
   */
  formats (formats, strict) {
    helpers.addFormats(this.routes, formats, strict)
    return this
  }

}

module.exports = Group
