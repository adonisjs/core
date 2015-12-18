'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeRes = require('node-res')
const nodeCookie = require('node-cookie')
let viewInstance = null
let routeInstance = null

/**
 * @class  Response class to be passed on
 * every node request to make responses.
 */
class Response {

  constructor (request, response) {
    this.request = request
    this.response = response
  }

  /**
   * @description set key/value pair on response header
   * @method header
   * @param  {String} key
   * @param  {Mixed} value
   * @return {Object}
   * @public
   */
  header (key, value) {
    nodeRes.header(this.response, key, value)
    return this
  }

  /**
   * @description creates a new view using View class
   * @method view
   * @param  {String} template
   * @param  {Object} options
   * @return {void}
   * @public
   */
  * view (template, options) {
    return viewInstance.make(template, options)
  }

  /**
   * @description removes header from response.
   * @method removeHeader
   * @param  {String}     key
   * @return {Object}
   * @public
   */
  removeHeader (key) {
    nodeRes.removeHeader(this.response, key)
    return this
  }

  /**
   * @description set's response status
   * @method status
   * @param  {Number} statusCode
   * @return {Object}
   * @public
   */
  status (statusCode) {
    nodeRes.status(this.response, statusCode)
    return this
  }

  /**
   * ends response, should not be used with
   * send method
   * @method end
   * @return {void}
   * @public
   */
  end () {
    nodeRes.end(this.response)
  }

  /**
   * @description writes to response body and ends it
   * @method send
   * @param  {Mixed} body
   * @return {void}
   * @public
   */
  send (body) {
    nodeRes.send(this.request, this.response, body)
  }

  /**
   * @description writes json response using send method
   * @method json
   * @param  {Object} body
   * @return {void}
   * @public
   */
  json (body) {
    nodeRes.json(this.request, this.response, body)
  }

  /**
   * @description writes jsonp response using send method
   * @method json
   * @param  {Object} body
   * @return {void}
   * @public
   */
  jsonp (body) {
    const callback = this.request.input('callback')
    nodeRes.jsonp(this.request, this.response, body, callback)
  }

  /**
   * @description sends input file for downloading
   * @method download
   * @param  {String} filePath
   * @return {void}
   * @public
   */
  download (filePath) {
    nodeRes.download(this.response, filePath)
  }

  /**
   * @description force download input file by setting content-disposition
   * to attachment
   * @method attachment
   * @param  {String}   filePath
   * @param  {String}   name
   * @param  {String}   disposition
   * @return {void}
   */
  attachment (filePath, name, disposition) {
    nodeRes.attachment(this.response, filePath, name, disposition)
  }

  /**
   * @description sets location header on response
   * @method location
   * @param  {String} toUrl
   * @return {Object}
   */
  location (toUrl) {
    nodeRes.location(this.response, toUrl)
    return this
  }

  /**
   * @description redirect request to a given url
   * @method redirect
   * @param  {String} toUrl
   * @param  {Number} status
   * @return {void}
   */
  redirect (toUrl, status) {
    nodeRes.redirect(this.request, this.response, toUrl, status)
  }

  /**
   * @description sets vary header on response
   * @method vary
   * @param  {String} field
   * @return {Object}
   */
  vary (field) {
    nodeRes.vary(this.response, field)
    return this
  }

  /**
   * @description redirects to a url created using route url
   * helper
   * @method route
   * @param  {String} route
   * @param  {Object} data
   * @param  {Number} status
   * @return {void}
   * @public
   */
  route (route, data, status) {
    const toUrl = routeInstance.url(route, data)
    this.redirect(toUrl, status)
  }

  /**
   * @description updates cookie header while making response
   * @method cookie
   * @param  {String} key
   * @param  {Mixed} value
   * @param  {Object} options
   * @return {Object}
   * @public
   */
  cookie (key, value, options) {
    const secret = process.env.APP_KEY
    const encrypt = !!secret
    nodeCookie.create(this.request.request, this.response, key, value, options, secret, encrypt)
    return this
  }

  /**
   * @description clears existing cookie from response header
   * @method clearCookie
   * @param  {String}    key
   * @param  {Object}    options
   * @return {Object}
   */
  clearCookie (key, options) {
    nodeCookie.clear(this.request.request, this.response, key, options)
    return this
  }

}

/**
 * @class  ResponseBuilder
 * @description returns Response class after setting up
 * view instance.
 */
class ResponseBuilder {
  constructor (View, Route) {
    viewInstance = View
    routeInstance = Route
    return Response
  }
}

module.exports =  ResponseBuilder
