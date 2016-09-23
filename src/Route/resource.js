'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const helpers = require('./helpers')
const CatLog = require('cat-log')
const logger = new CatLog('adonis:framework')
const util = require('../../lib/util')
const ResourceMember = require('./ResourceMember')
const ResourceCollection = require('./ResourceCollection')
const CE = require('../Exceptions')

/**
 * Resource management for Http routes.
 * @class
 * @alias Route.Resource
 */
class Resource {

  constructor (RouteHelper, pattern, handler) {
    if (typeof (handler) !== 'string') {
      throw CE.InvalidArgumentException.invalidParameter('You can only bind controllers to resources')
    }
    if (pattern === '/') {
      logger.warn('You are registering a resource for / path, which is not a good practice')
    }
    this.RouteHelper = RouteHelper
    this.pattern = this._makePattern(pattern)
    this.handler = handler
    this.routes = []
    this.basename = pattern.replace('/', '')
    this._buildRoutes()
    return this
  }

  /**
   * register a route to the routes store
   * and pushes it to local array to reference it
   * later
   *
   * @param  {String}       verb
   * @param  {String}       route
   * @param  {String}       handler
   * @param  {String}       name
   *
   * @return {Object}
   *
   * @private
   */
  _registerRoute (verb, route, handler, name) {
    const resourceName = (this.basename === '/' || !this.basename) ? name : `${this.basename}.${name}`
    this.RouteHelper.route(route, verb, `${handler}.${name}`).as(resourceName)
    const registeredRoute = this.RouteHelper._lastRoute()
    this.routes.push(registeredRoute)
    return registeredRoute
  }

  /**
   * creates pattern for a given resource by removing
   * {.} with nested route resources.
   *
   * @param  {String} pattern [description]
   * @return {String}         [description]
   *
   * @example
   * user.post.comment will return
   * user/user_id/post/post_id/comment
   *
   * @private
   */
  _makePattern (pattern) {
    return pattern.replace(/(\w+)\./g, function (index, group) {
      return `${group}/:${group}_id/`
    }).replace(/\/$/, '')
  }

  /**
   * builds all routes for a given pattern
   *
   * @method _buildRoutes
   *
   * @return {void}
   *
   * @private
   */
  _buildRoutes () {
    this._registerRoute(['GET', 'HEAD'], this.pattern, this.handler, 'index')
    this._registerRoute(['GET', 'HEAD'], `${this.pattern}/create`, this.handler, 'create')
    this._registerRoute('POST', `${this.pattern}`, this.handler, 'store')
    this._registerRoute(['GET', 'HEAD'], `${this.pattern}/:id`, this.handler, 'show')
    this._registerRoute(['GET', 'HEAD'], `${this.pattern}/:id/edit`, this.handler, 'edit')
    this._registerRoute(['PUT', 'PATCH'], `${this.pattern}/:id`, this.handler, 'update')
    this._registerRoute('DELETE', `${this.pattern}/:id`, this.handler, 'destroy')
  }

  /**
   * transform methods keys to resource route names
   *
   * @method _transformKeys
   *
   * @param  {Array}       pairKeys
   * @return {Array}
   *
   * @throws {Error} If pairKeys are not defines as array
   *
   * @private
   */
  _transformKeys (pairKeys) {
    if (!_.isArray(pairKeys)) {
      throw CE.InvalidArgumentException.invalidParameter('Resource route methods must be defined as an array')
    }
    return pairKeys.map((item) => {
      return `${this.basename}.${item}`
    })
  }

  /**
   * registers an expression of middleware to the specified
   * actions
   *
   * @param   {Object} expression
   *
   * @private
   */
  _registerMiddlewareViaExpression (expression) {
    _(expression)
    .map((methods, middleware) => {
      const routes = _.filter(this.routes, (route) => this._transformKeys(methods).indexOf(route.name) > -1)
      return {routes, middleware}
    })
    .each((item) => this._addMiddleware(item.routes, item.middleware))
  }

  /**
   * adds an array of middleware to the given routes
   *
   * @param   {Array} routes
   * @param   {Array} middleware
   *
   * @private
   */
  _addMiddleware (routes, middleware) {
    _.each(routes, (route) => {
      helpers.appendMiddleware(route, middleware)
    })
  }

  /**
   * {@link module:Route~as}
   */
  as (pairs) {
    const pairKeys = _.keys(pairs)
    const pairTransformedKeys = this._transformKeys(pairKeys)
    _.each(this.routes, function (route) {
      const pairIndex = pairTransformedKeys.indexOf(route.name)
      if (pairIndex > -1) {
        route.name = pairs[pairKeys[pairIndex]]
      }
    })
    return this
  }

  /**
   * removes all other actions from routes resources
   * except the given array
   *
   * @param  {Mixed} methods - An array of methods or multiple parameters defining
   *                           methods
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').only('create', 'store')
   * Route.resource('...').only(['create', 'store'])
   *
   * @public
   */
  only () {
    const methods = util.spread.apply(this, arguments)
    const transformedMethods = this._transformKeys(methods)
    this.routes = _.filter(this.routes, (route) => {
      if (transformedMethods.indexOf(route.name) <= -1) {
        this.RouteHelper.remove(route.name)
      } else {
        return true
      }
    })
    return this
  }

  /**
   * filters resource by removing routes for defined actions
   *
   * @param  {Mixed} methods - An array of methods or multiple parameters defining
   *                           methods
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').except('create', 'store')
   * Route.resource('...').except(['create', 'store'])
   *
   * @public
   */
  except () {
    const methods = util.spread.apply(this, arguments)
    const transformedMethods = this._transformKeys(methods)
    this.routes = _.filter(this.routes, (route) => {
      if (transformedMethods.indexOf(route.name) > -1) {
        this.RouteHelper.remove(route.name)
      } else {
        return true
      }
    })
    return this
  }

  /**
   * See {@link module:Route~formats}
   */
  formats (formats, strict) {
    helpers.addFormats(this.routes, formats, strict)
    return this
  }

  /**
   * add a member route to the resource
   *
   * @param  {String} route - Route and action to be added to the resource
   * @param  {Mixed}  [verbs=['GET', 'HEAD']]  - An array of verbs
   * @param {Function} [callback]
   *
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').addMember('completed')
   *
   * @public
   */
  addMember (route, verbs, callback) {
    if (_.isEmpty(route)) {
      throw CE.InvalidArgumentException.invalidParameter('Resource.addMember expects a route')
    }

    verbs = verbs || ['GET', 'HEAD']
    verbs = _.isArray(verbs) ? verbs : [verbs]
    const registeredRoute = this._registerRoute(verbs, `${this.pattern}/:id/${route}`, this.handler, route)
    if (typeof (callback) === 'function') {
      callback(new ResourceMember(registeredRoute))
    }
    return this
  }

  /**
   * add a collection route to the resource
   *
   * @param  {String} route - Route and action to be added to the resource
   * @param  {Mixed}  [verbs=['GET', 'HEAD']]  - An array of verbs
   * @param {Function} [callback]
   *
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').addCollection('completed')
   *
   * @public
   */
  addCollection (route, verbs, callback) {
    if (_.isEmpty(route)) {
      throw CE.InvalidArgumentException.invalidParameter('Resource.addCollection expects a route')
    }

    verbs = verbs || ['GET', 'HEAD']
    verbs = _.isArray(verbs) ? verbs : [verbs]
    const registeredRoute = this._registerRoute(verbs, `${this.pattern}/${route}`, this.handler, route)
    if (typeof (callback) === 'function') {
      callback(new ResourceCollection(registeredRoute))
    }
    return this
  }

  /**
   * @see this.middleware
   */
  middlewares () {
    logger.warn('resource@middlewares: consider using method middleware, instead of middlewares')
    return this.middleware.apply(this, arguments)
  }

  /**
   * adds middleware to the resource
   *
   * @param  {Mixed} middlewareExpression
   *
   * @return {Object}
   *
   * @example
   * Route.resource(...).middleware('auth')
   * Route.resource(...).middleware({
   *  auth: ['store', 'update', 'delete'],
   *  web: ['index']
   * })
   *
   * @public
   */
  middleware (middlewareExpression) {
    if (_.isObject(middlewareExpression) && !_.isArray(middlewareExpression)) {
      this._registerMiddlewareViaExpression(middlewareExpression)
      return this
    }
    this._addMiddleware(this.routes, util.spread.apply(this, arguments))
    return this
  }

  /**
   * returns routes JSON representation, helpful for
   * inspection
   *
   * @return {Array}
   *
   * @public
   */
  toJSON () {
    return this.routes
  }

}

module.exports = Resource
