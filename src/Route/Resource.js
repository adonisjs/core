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
const Route = require('./index')
const RouteStore = require('./Store')
const CE = require('../Exceptions')

/**
 * Route Resource class is used to define resourceful
 * routes. You can create a resource instance by
 * calling `Route.resource()` method.
 *
 * @class RouteResource
 * @group Http
 * @constructor
 */
class RouteResource {
  constructor (resource, controller, namePrefix = null) {
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
    this._namePrefix = namePrefix ? `${namePrefix}.${resource}` : resource

    /**
     * Keeping a local copy of routes, so that filter through
     * it and remove the actual routes from the routes store.
     * The filteration is done via `except` and `only` methods.
     *
     * @type {Array}
     */
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
      throw CE.InvalidArgumentException.invalidParameter('Route.resource expects name to be a string', resource)
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
      throw CE.InvalidArgumentException.invalidParameter('Route.resource expects reference to a controller', controller)
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
   * @param  {String}  name
   * @param  {String}  route
   * @param  {Array}   verbs
   *
   * @private
   */
  _addRoute (name, route, verbs = ['HEAD', 'GET']) {
    const routeInstance = new Route(route, `${this._controller}.${name}`, verbs)

    routeInstance.as(`${this._namePrefix}.${name}`)

    RouteStore.add(routeInstance)
    this._routes.push({name, routeInstance})
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
      if (names.indexOf(route.name) === -1) {
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
      if (names.indexOf(route.name) > -1) {
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
   * @param  {...Spread} middleware
   *
   * @chainable
   *
   * @example
   * ```js
   * Route
   *   .resource()
   *   .middleware(['auth'])
   *
   * // or
   *
   * Route
   *   .resource()
   *   .middleware((route) => {
   *     if (['store', 'update', 'delete'].indexOf(route.name) > -1) {
   *       return ['auth']
   *     }
   *
   *     return []
   *   })
   * ```
   */
  middleware (...middleware) {
    /**
     * If first argument is a function, we consider it as
     * the closure to define dynamic middleware based
     * upon some logic.
     *
     * The closure will be executed for each route and return
     * value must be an array and used as the middleware for
     * the route.
     */
    const middlewareClosure = middleware[0]

    _.each(this._routes, (route) => {
      if (typeof (middlewareClosure) === 'function') {
        route.routeInstance.middleware(middlewareClosure(route.routeInstance.toJSON()))
      } else {
        route.routeInstance.middleware(_.flatten(middleware))
      }
    })

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

module.exports = RouteResource
