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
const Macroable = require('macroable')
const GE = require('@adonisjs/generic-exceptions')

const Route = require('./index')
const RouteStore = require('./Store')

/**
 * Route Resource class is used to define resourceful
 * routes. You can create a resource instance by
 * calling `Route.resource()` method.
 *
 * @class RouteResource
 * @group Http
 * @constructor
 */
class RouteResource extends Macroable {
  constructor (resource, controller, groupPrefix = null) {
    super()
    this._validateResourceName(resource)
    this._validateController(controller)

    this._resourceUrl = this._makeResourceUrl(resource)
    this._controller = controller

    /**
     * The name prefix is used to prefix the route names.
     * Generally used when resource is defined inside
     * the Route group
     *
     * @type {String}
     */
    this.prefix = groupPrefix ? `${groupPrefix}.${resource}` : resource

    this._routes = []
    this._addBasicRoutes()
  }

  /**
   * Validates the resource name to make sure it
   * is a valid string.
   *
   * @method _validateResourceName
   *
   * @param  {String}              resource
   *
   * @return {void}
   *
   * @private
   */
  _validateResourceName (resource) {
    if (typeof (resource) !== 'string') {
      throw GE.InvalidArgumentException.invalidParameter('Route.resource expects name to be a string', resource)
    }
  }

  /**
   * Validates the resource controller to a valid
   * string. Existence of controller is validated
   * when the controller is resolved.
   *
   * @method _validateController
   *
   * @param  {String}            controller
   *
   * @return {void}
   *
   * @private
   */
  _validateController (controller) {
    if (typeof (controller) !== 'string') {
      throw GE.InvalidArgumentException.invalidParameter('Route.resource expects reference to a controller', controller)
    }
  }

  /**
   * Makes the correct resource url by properly
   * configuring nested resources.
   *
   * @method _makeResourceUrl
   *
   * @param  {String}      resource
   *
   * @return {String}
   *
   * @private
   *
   * @example
   * ```js
   * _makeResourceUrl('user.posts')
   * // returns - user/:user_id/posts
   * ```
   */
  _makeResourceUrl (resource) {
    return resource
      .replace(/(\w+)\./g, (index, group) => `${group}/:${group}_id/`)
      .replace(/^\/|\/$/g, '')
  }

  /**
   * Add route to the routes array and to the
   * routes store.
   *
   * @method _addRoute
   *
   * @param  {String}  action
   * @param  {String}  route
   * @param  {Array}   verbs
   *
   * @private
   */
  _addRoute (action, route, verbs = ['HEAD', 'GET']) {
    const routeInstance = new Route(route, `${this._controller}.${action}`, verbs)
    routeInstance.as(`${this.prefix}.${action}`)

    RouteStore.add(routeInstance)
    this._routes.push({ action, routeInstance })
  }

  /**
   * Add basic routes to the routes list. The list
   * is further filtered using `only` and `except`
   * methods.
   *
   * @method _addBasicRoutes
   *
   * @private
   */
  _addBasicRoutes () {
    this._addRoute('index', this._resourceUrl)
    this._addRoute('create', `${this._resourceUrl}/create`)
    this._addRoute('store', this._resourceUrl, ['POST'])
    this._addRoute('show', `${this._resourceUrl}/:id`)
    this._addRoute('edit', `${this._resourceUrl}/:id/edit`)
    this._addRoute('update', `${this._resourceUrl}/:id`, ['PUT', 'PATCH'])
    this._addRoute('destroy', `${this._resourceUrl}/:id`, ['DELETE'])
  }

  /**
   * Matches the route against an array of names. It will
   * match the route action and it's original name
   *
   * @method _matchName
   *
   * @param  {Route}   route
   * @param  {Array}   names
   *
   * @return {Boolean}
   *
   * @private
   */
  _matchName (route, names) {
    return names.indexOf(route.action) > -1 || names.indexOf(route.routeInstance.name) > -1
  }

  /**
   * Remove all routes from the resourceful list except the
   * one defined here.
   *
   * @method only
   *
   * @param  {Array} names
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .resource()
   *   .only(['store', 'update'])
   * ```
   */
  only (names) {
    _.remove(this._routes, (route) => {
      if (!this._matchName(route, names)) {
        RouteStore.remove(route.routeInstance)
        return true
      }
    })
    return this
  }

  /**
   * Remove the routes define here from the resourceful list.
   *
   * @method except
   *
   * @param  {Array} names
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .resource()
   *   .except(['delete'])
   * ```
   */
  except (names) {
    _.remove(this._routes, (route) => {
      if (this._matchName(route, names)) {
        RouteStore.remove(route.routeInstance)
        return true
      }
    })
    return this
  }

  /**
   * Limit the number of routes to api only. In short
   * this method will remove `create` and `edit`
   * routes.
   *
   * @method apiOnly
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .resource()
   *   .apiOnly()
   * ```
   */
  apiOnly () {
    return this.except(['create', 'edit'])
  }

  /**
   * Save middleware to be applied on the resourceful routes. This
   * method also let you define conditional middleware based upon
   * the route attributes.
   *
   * For example you want to apply `auth` middleware to the `store`,
   * `update` and `delete` routes and want other routes to be
   * publicly accessible. Same can be done by passing a
   * closure to this method and returning an array
   * of middleware to be applied.
   *
   * ## NOTE
   * The middleware closure will be executed for each route.
   *
   * @method middleware
   *
   * @param  {Array|Map} middleware
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .resource()
   *   .middleware(['auth'])
   *
   * // or use ES6 maps
   * Route
   *   .resource('user', 'UserController')
   *   .middleware(new Map([
   *     [['user.store', 'user.update', 'user.delete'], 'auth']
   *   ]))
   * ```
   */
  middleware (middleware) {
    const middlewareMap = middleware instanceof Map ? middleware : new Map([
      [['*'], _.castArray(middleware)]
    ])

    for (let [routeNamesList, middlewareList] of middlewareMap) {
      routeNamesList = _.castArray(routeNamesList)
      middlewareList = _.castArray(middlewareList)

      _.each(this._routes, (route) => {
        if (routeNamesList[0] === '*') {
          route.routeInstance.middleware(middlewareList)
        } else if (this._matchName(route, routeNamesList)) {
          route.routeInstance.middleware(middlewareList)
        }
      })
    }

    return this
  }

  /**
   * Define route formats for all the routes inside
   * a resource.
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
   *   .resource()
   *   .formats(['json'], true)
   * ```
   */
  formats (formats, strict = false) {
    _.each(this._routes, (route) => {
      route.routeInstance.formats(formats, strict)
    })
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
RouteResource._macros = {}
RouteResource._getters = {}

module.exports = RouteResource
