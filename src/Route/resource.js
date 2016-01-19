'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const _ = require('lodash')
const helpers = require('./helpers')

class Resource {

  constructor (RouteHelper, pattern, handler) {
    this.RouteHelper = RouteHelper
    this.routes = []
    this.basename = pattern.replace(/\\/g, '')
    this._buildRoutes(pattern, handler)
    return this
  }

  /**
   * @description register a route to the routes store
   * and pushes it to local array to reference it
   * later
   * @method _registerRoute
   * @param  {String}       verb
   * @param  {String}       route
   * @param  {String}       handler
   * @param  {String}       name
   * @return {void}
   * @public
   */
  _registerRoute (verb, route, handler, name) {
    this.RouteHelper[verb](route, `${handler}.${name}`).as(`${this.basename}.${name}`)
    this.routes.push(this.RouteHelper.lastRoute())
  }

  /**
   * @description builds all routes for a given pattern
   * @method _buildRoutes
   * @param  {String}     pattern
   * @param  {String}     handler
   * @return {void}
   * @public
   */
  _buildRoutes (pattern, handler) {
    pattern = pattern.replace(/(\w+)\./g, function (index, group) {
      return `${group}/:${group}_id/`
    })
    const seperator = pattern.endsWith('/') ? '' : '/'

    this._registerRoute('get', pattern, handler, 'index')
    this._registerRoute('get', `${pattern}${seperator}create`, handler, 'create')
    this._registerRoute('post', `${pattern}`, handler, 'store')
    this._registerRoute('get', `${pattern}${seperator}:id`, handler, 'show')
    this._registerRoute('get', `${pattern}${seperator}:id/edit`, handler, 'edit')
    this._registerRoute('put', `${pattern}${seperator}:id`, handler, 'update')
    this._registerRoute('patch', `${pattern}${seperator}:id`, handler, 'update')
    this._registerRoute('delete', `${pattern}${seperator}:id`, handler, 'destroy')
  }

  /**
   * @description transform methods keys to resource route names
   * @method _transformKeys
   * @param  {Array}       pairKeys
   * @return {Array}
   */
  _transformKeys (pairKeys) {
    return pairKeys.map((item) => {
      return `${this.basename}.${item}`
    })
  }

  /**
   * @description change names for defined routes mapped
   * next to actions
   * @method as
   * @param  {Object} pairs
   * @return {Object}
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
   * @description removes all other actions from routes
   * resources except the given array
   * @method only
   * @param  {Array} methods
   * @return {Object}
   * @public
   */
  only (methods) {
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
   * @description removes actions defined inside given array
   * from all resources routes
   * @method except
   * @param  {Array} methods
   * @return {Object}
   * @public
   */
  except (methods) {
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
   * @description adds formats to an array of routes
   * @method formats
   * @param  {Array} formats [description]
   * @param  {Boolean} strict  [description]
   * @return {Object}         [description]
   * @public
   */
  formats (formats, strict) {
    helpers.addFormats(this.routes, formats, strict)
    return this
  }

}

module.exports = Resource
