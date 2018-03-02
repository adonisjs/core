'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const pathToRegexp = require('path-to-regexp')
const GE = require('@adonisjs/generic-exceptions')
const Macroable = require('macroable')

/**
 * This class defines a single route. It supports dynamic
 * **url segments**, **formats**, **middleware**
 * and **named routes**.
 *
 * Generally you will get the instance of the by calling
 * one of the route method on the @ref('RouteManager')
 * class.
 *
 * Example: `Route.get`, `Route.post`.
 *
 * @class Route
 * @group Http
 * @constructor
 *
 * @example
 * ```
 * const route = new Route('users', 'HomeController.index', ['GET'])
 * ```
 */
class Route extends Macroable {
  constructor (route, handler, verbs = ['HEAD', 'GET']) {
    super()
    this._instantiate(route, verbs, handler)
    this._makeRoutePattern()
  }

  /**
   * Validates the route to make sure it is a
   * valid string
   *
   * @method _validateRoute
   *
   * @param  {String}       route
   *
   * @return {void}
   *
   * @private
   */
  _validateRoute (route) {
    if (typeof (route) !== 'string') {
      throw GE.InvalidArgumentException.invalidParameter('Cannot instantiate route without a valid url string', route)
    }
  }

  /**
   * Validates the handler to make sure it is a function
   * or a string, which is considered to be a reference
   * to the IoC container.
   *
   * @method _validateHandler
   *
   * @param  {Function|String}         handler
   *
   * @return {void}
   *
   * @private
   */
  _validateHandler (handler) {
    if (['string', 'function'].indexOf(typeof (handler)) === -1) {
      throw GE.InvalidArgumentException.invalidParameter('Cannot instantiate route without route handler', handler)
    }
  }

  /**
   * Validate HTTP verbs to make sure it is an
   * array
   *
   * @method _validateVerbs
   *
   * @param  {Array}       verbs
   *
   * @return {void}
   *
   * @private
   */
  _validateVerbs (verbs) {
    if (!Array.isArray(verbs)) {
      throw GE.InvalidArgumentException.invalidParameter('New route expects HTTP verbs to be an array', verbs)
    }
  }

  /**
   * Instantiate private properties on the route instance
   *
   * @method _instantiate
   *
   * @param  {String}              route
   * @param  {Array}               verbs
   * @param  {Function|String}     handler
   *
   * @return {void}
   *
   * @private
   */
  _instantiate (route, verbs, handler) {
    this._validateRoute(route)
    this._validateVerbs(verbs)
    this._validateHandler(handler)

    route = `/${route.replace(/^\/|\/$/g, '')}`

    /**
     * Private properties
     */
    this._route = route === '/*' ? '/(.*)' : route
    this._keys = []

    /**
     * Public properties
     */
    this.verbs = verbs
    this.handler = handler
    this.name = route
    this.forDomain = null
    this.middlewareList = []
    this.domainKeys = []
  }

  /**
   * Make the regexp pattern for the route. Later this
   * expression is used to match urls.
   *
   * @method _makeRoutePattern
   *
   * @return {void}
   *
   * @private
   */
  _makeRoutePattern () {
    this._keys = []
    this._regexp = pathToRegexp(this._route, this._keys)
  }

  /**
   * Returns an object of dynamic domains for a given
   * route.
   *
   * @method _getSubDomains
   *
   * @param  {String}       host
   *
   * @return {Object|Null}
   *
   * @private
   */
  _getSubDomains (host) {
    if (!this.forDomain) {
      return null
    }

    const domainTokens = this.forDomain.exec(host)
    if (!domainTokens) {
      return null
    }

    return _.transform(this.domainKeys, (result, key, index) => {
      let value = domainTokens[index + 1] || null
      result[key.name] = value
      return result
    }, {})
  }

  /**
   * Define domain for the route. If domain is defined
   * then route will only resolve when domain matches.
   *
   * @method domain
   *
   * @param  {String}  domain
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .get(...)
   *   .domain('blog.adonisjs.com')
   * ```
   */
  domain (domain) {
    this.domainKeys = []
    domain = `${domain.replace(/^\/|\/$/g, '')}`
    this.forDomain = pathToRegexp(domain, this.domainKeys)
    return this
  }

  /**
   * Define formats on a given route. Formats can be
   * used to do explicit content negotiation based
   * upon the url extension.
   *
   * @method formats
   *
   * @param  {Array}  formats
   * @param  {Boolean} [strict = false] - Strict flag will only allow route with format extension.
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .get(...)
   *   .formats(['json', 'html'])
   * ```
   */
  formats (formats, strict = false) {
    const flag = strict ? '' : '?'
    const formatsPattern = `:format(.${formats.join('|.')})${flag}`
    this._route = `${this._route}${formatsPattern}`
    this._makeRoutePattern()
    return this
  }

  /**
   * Give name to the route, easier to remember
   * and resolve later.
   *
   * @method as
   *
   * @param  {String} name
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .get(...)
   *   .as('name')
   * ```
   */
  as (name) {
    this.name = name
    return this
  }

  /**
   * Add middleware to the middleware queue to be executed
   * before the route handler is executed.
   *
   * Calling this method for the multiple times will `concat`
   * to the list of middleware.
   *
   * @method middleware
   *
   * @param  {...Spread} middleware
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .get('...')
   *   .middleware('auth')
   *
   * // Or
   * Route
   *   .get('...')
   *   .middleware(['auth', 'acl'])
   *
   * // Also pure functions
   * Route
   *   .get('...')
   *   .middleware(async function () {
   *
   *   })
   * ```
   */
  middleware (...middleware) {
    this.middlewareList = this.middlewareList.concat(_.flatten(middleware))
    return this
  }

  /**
   * Add a folder namespace to the route. Generally
   * used by the Route group to namespace a bunch of
   * routes that are all inside the same folder.
   *
   * @method namespace
   *
   * @param  {String} namespace
   *
   * @chainable
   *
   * @example
   * ```
   * Route
   *   .get(...)
   *   .namespace('Admin')
   * ```
   */
  namespace (namespace) {
    if (typeof (this.handler) !== 'string') return this

    namespace = `${namespace.replace(/^\/|\/$/g, '')}/`
    this.handler = `${namespace}${this.handler}`
    return this
  }

  /**
   * Add middleware to the front of the route. The method is
   * same as `middleware` instead just prepends instead of
   * append.
   *
   * @method prependMiddleware
   *
   * @param  {...Spread}       middleware
   *
   * @chainable
   */
  prependMiddleware (...middleware) {
    this.middlewareList = _.flatten(middleware).concat(this.middlewareList)
    return this
  }

  /**
   * Prefix the route with some string. Generally
   * used by the Route group to prefix a bunch
   * of routes.
   *
   * @method prefix
   *
   * @param  {String} prefix
   *
   * @chainable
   *
   * @example
   * ```
   * Route
   *   .get(...)
   *   .prefix('api/v1')
   * ```
   */
  prefix (prefix) {
    prefix = `/${prefix.replace(/^\/|\/$/g, '')}`
    this._route = this._route === '/' ? prefix : `${prefix}${this._route}`
    this._makeRoutePattern()
    return this
  }

  /**
   * Resolves the url by matching it against
   * the registered route and verbs. It will
   * return `null` when url does not belongs
   * to this route.
   *
   * @method resolve
   *
   * @param  {String} url
   * @param  {String} verb
   * @param  {String} [host] - Required only when route has subdomain
   *
   * @return {Object|Null}
   *
   * @example
   * ```js
   * // Register route
   * const route = new Route('make/:drink', 'DrinkController.make', ['GET'])
   *
   * // Resolve url
   * route.resolve('make/coffee', 'GET')
   *
   * // Returns
   * { url: 'make/coffee', params: ['coffee'] }
   * ```
   */
  resolve (url, verb, host) {
    /**
     * Return null when verb mis-matches
     */
    if (this.verbs.indexOf(verb) === -1) {
      return null
    }

    /**
     * Check for matching subdomains
     */
    const subdomains = this._getSubDomains(host)
    if (this.forDomain && !subdomains) {
      return null
    }

    /**
     * Nothing needs processing, since the route
     * and the url are same.
     */
    if (this._route === url) {
      return { url, params: {}, subdomains: subdomains || {} }
    }

    /**
     * Get route tokens if matched otherwise
     * return null.
     */
    const tokens = this._regexp.exec(url)
    if (!tokens) {
      return null
    }

    const params = _.transform(this._keys, (result, key, index) => {
      let value = tokens[index + 1] || null
      value = key.repeat && value ? value.split('/') : value
      result[key.name] = value
      return result
    }, {})

    return { url, params, subdomains: subdomains || {} }
  }

  /**
   * Returns the JSON representation of the route.
   *
   * @method toJSON
   *
   * @return {Object}
   */
  toJSON () {
    return {
      route: this._route,
      verbs: this.verbs,
      handler: this.handler,
      middleware: this.middlewareList,
      name: this.name,
      domain: this.forDomain
    }
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
Route._macros = {}
Route._getters = {}

module.exports = Route
