'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Macroable = require('macroable')

/**
 * Route Group class is used to group routes with
 * common behavior. For example prefixing a bunch
 * of routes or applying middleware to a bunch
 * of routes.
 *
 * An instance of group is obtained by calling the
 * `Route.group` method on @ref('RouteManager')
 * class.
 *
 * @class RouteGroup
 * @group Http
 * @constructor
 *
 * @example
 * ```js
 * const group = new RouteGroup([arrayOfRoutes], optionalName)
 * ```
 */
class RouteGroup extends Macroable {
  constructor (routes, name = null) {
    super()
    this._routes = routes
    this._name = name
  }

  /**
   * Add middleware to a group of routes.
   * Also see @ref('Route/middleware').
   *
   * @method middleware
   *
   * @param  {Array|String|Spread}   middleware
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .group()
   *   .middleware('auth')
   * ```
   */
  middleware (...middleware) {
    this._routes.forEach((route) => route.prependMiddleware(...middleware))
    return this
  }

  /**
   * Namespace group of routes.
   * Also see @ref('Route/namespace')
   *
   * @method namespace
   *
   * @param  {String} namespace
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .group()
   *   .namespace('Admin')
   * ```
   */
  namespace (namespace) {
    this._routes.forEach((route) => route.namespace(namespace))
    return this
  }

  /**
   * Add formats to a group of routes.
   * Also see @ref('Route/formats')
   *
   * @method formats
   *
   * @param  {Array}   formats
   * @param  {Boolean} [strict = false]
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .group()
   *   .formats(['json', 'html'])
   * ```
   */
  formats (formats, strict = false) {
    this._routes.forEach((route) => route.formats(formats, strict))
    return this
  }

  /**
   * Prefix group of routes.
   * Also see @ref('Route/prefix')
   *
   * @method prefix
   *
   * @param  {String} prefix
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .group()
   *   .prefix('api/v1')
   * ```
   */
  prefix (prefix) {
    this._routes.forEach((route) => route.prefix(prefix))
    return this
  }

  /**
   * Add domain to a group of routes.
   * Also see @ref('Route/domain')
   *
   * @method domain
   *
   * @param  {String} domain
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .group()
   *   .domain('blog.adonisjs.com')
   * ```
   */
  domain (domain) {
    this._routes.forEach((route) => route.domain(domain))
    return this
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
RouteGroup._macros = {}
RouteGroup._getters = {}

module.exports = RouteGroup
