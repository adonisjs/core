'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')

class Form {

  constructor (View, Route) {
    this.env = View.viewsEnv
    this.specialKeywords = ['url', 'files', 'method', 'route', 'action', 'params']
    this.validFormMethods = ['GET', 'POST']
    this.route = Route
  }

  /**
   * returns method to be used for
   * submitting forms
   *
   * @method _getMethod
   * @param  {String}   method
   * @return {String}
   *
   * @private
   */
  _getMethod (method) {
    if (!method) {
      return 'POST'
    }
    method = method.toUpperCase()
    return this.validFormMethods.indexOf(method) > -1 ? method : 'POST'
  }

  /**
   * returns url to be set as form action
   *
   * @method _getUrl
   *
   * @param  {Object} options
   * @return {String}
   *
   * @private
   */
  _getUrl (options) {
    let url = options.url
    if (options.route) {
      url = this.env.filters.route(options.route, options.params)
    }
    return url
  }

  /**
   * makes html attributes from an object
   *
   * @method _makeHtmlAttributes
   *
   * @param  {Object}            attributes
   * @param  {Array}             [avoid=[]]
   * @return {Array}
   *
   * @private
   */
  _makeHtmlAttributes (attributes, avoid) {
    avoid = avoid || []
    const htmlAttributes = []
    _.each(attributes, (value, index) => {
      if (avoid.indexOf(index) <= -1) {
        htmlAttributes.push(`${index}="${value}"`)
      }
    })
    return htmlAttributes
  }

  /**
   * returns enctype to be used for submitting form
   * @method _getEncType
   * @param  {Boolean}    files
   * @return {String}
   * @private
   */
  _getEncType (files) {
    return files ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
  }

  /**
   * adds query string for method spoofing if method is other
   * than get and post
   * @method _makeMethodQueryString
   * @param  {String}               method
   * @param  {String}               url
   * @return {String}
   * @private
   */
  _makeMethodQueryString (method, url) {
    if (this.validFormMethods.indexOf(method) > -1) {
      return url
    }
    const symbol = url.indexOf('?') > -1 ? '&' : '?'
    return `${url}${symbol}_method=${method.toUpperCase()}`
  }

  /**
   * open a form tag and sets it's action,method
   * enctype and other attributes
   * @method open
   * @param  {Object} options - options to be used in order to create
   *                            form tag
   * @return {Object} - view specific object
   *
   * @example
   * Form.open({url: '/user/:id', method: 'PUT', params: {id: 1}})
   * Form.open({route: 'user.update', method: 'PUT', params: {id: 1}})
   * Form.open({action: 'UserController.update', method: 'PUT', params: {id: 1}})
   *
   * @public
   */
  open (options) {
    /**
     * if user has defined route, fetch actual
     * route defination using Route module
     * and use the method.
     */
    if (options.route) {
      const route = this.route.getRoute({name: options.route})
      options.method = route.verb[0]
    }

    /**
     * if user has defined action, fetch actual
     * route defination using Route module
     * and use the method and route.
     */
    if (options.action) {
      const route = this.route.getRoute({handler: options.action})
      options.method = route.verb[0]
      options.route = route.route
    }

    let url = this._getUrl(options)
    const actualMethod = options.method || 'POST'
    const method = this._getMethod(actualMethod)
    const enctype = this._getEncType(options.files)
    url = this._makeMethodQueryString(actualMethod, url)
    let formAttributes = []

    formAttributes.push(`method="${method}"`)
    formAttributes.push(`action="${url}"`)
    formAttributes.push(`enctype="${enctype}"`)
    formAttributes = formAttributes.concat(this._makeHtmlAttributes(options, this.specialKeywords))
    return this.env.filters.safe(`<form ${formAttributes.join(' ')}>`)
  }

  label (name, value, attributes) {
    attributes = attributes || {}
    const labelAttributes = [`name="${name}"`].concat(this._makeHtmlAttributes(attributes))
    return this.env.filters.safe(`<label ${labelAttributes.join(' ')}> ${value} </label>`)
  }
}

module.exports = Form
