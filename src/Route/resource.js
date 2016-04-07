'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const helpers = require('./helpers')
const util = require('../../lib/util')
const NE = require('node-exceptions')

/**
 * Resource management for Http routes.
 * @class
 * @alias Route.Resource
 */
class Resource {

  constructor (RouteHelper, pattern, handler) {
    if (typeof (handler) !== 'string') {
      throw new NE.DomainException('You can only bind controllers to resources')
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
   * @return {void}
   *
   * @private
   */
  _registerRoute (verb, route, handler, name) {
    const resourceName = (this.basename === '/' || !this.basename) ? name : `${this.basename}.${name}`
    this.RouteHelper.route(route, verb, `${handler}.${name}`).as(resourceName)
    this.routes.push(this.RouteHelper._lastRoute())
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
   * @private
   */
  _transformKeys (pairKeys) {
    return pairKeys.map((item) => {
      return `${this.basename}.${item}`
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
   * @param  {String} action - the handle action method
   *
   * @param  {String} route - Route and action to be added to the resource
   * @param  {Mixed}  [verbs=['GET', 'HEAD']]  - An array of verbs
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').addMember('completed')
   *
   * @public
   */
  addMember (route, verbs) {
    if (_.isEmpty(route)) {
      throw new NE.InvalidArgumentException('action argument must be present')
    }

    verbs = verbs || ['GET', 'HEAD']
    verbs = _.isArray(verbs) ? verbs : [verbs]
    this._registerRoute(verbs, `${this.pattern}/:id/${route}`, this.handler, route)
    return this
  }

  /**
   * add a collection route to the resource
   *
   * @param  {String} action - the handle action method
   *
   * @param  {String} route - Route and action to be added to the resource
   * @param  {Mixed}  [verbs=['GET', 'HEAD']]  - An array of verbs
   * @return {Object} - reference to resource instance for chaining
   *
   * @example
   * Route.resource('...').addCollection('completed')
   *
   * @public
   */
  addCollection (route, verbs) {
    if (_.isEmpty(route)) {
      throw new NE.InvalidArgumentException('action argument must be present')
    }

    verbs = verbs || ['GET', 'HEAD']
    verbs = _.isArray(verbs) ? verbs : [verbs]
    this._registerRoute(verbs, `${this.pattern}/${route}`, this.handler, route)
    return this
  }

}

module.exports = Resource
