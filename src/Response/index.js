'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nodeRes = require('node-res')
const nodeReq = require('node-req')
const Macroable = require('../Macroable')

/**
 * @module Adonis
 * @submodule framework
 */

/**
 * A facade over Node.js HTTP `res` object, making it
 * easier and simpler to make HTTP response. You can
 * access the original **response** object as
 * `response.response`
 *
 * @class Response
 */
class Response extends Macroable {
  constructor (request, response) {
    super()
    /**
     * Refrence to native HTTP request object
     *
     * @attribute request
     * @type {Object}
     */
    this.request = request

    /**
     * Refrence to native HTTP response object
     *
     * @attribute response
     * @type {Object}
     */
    this.response = response

    /**
     * Here we store the body of the response and wait
     * for the entire HTTP life-cycle to finish unless
     * we end the response. This gives a chance to
     * modify the response via middlewares executed
     * after the route handler or controller method.
     *
     * @attribute _lazyBody
     *
     * @type {Object}
     * @private
     */
    this._lazyBody = {
      method: 'send',
      content: null,
      args: []
    }

    /**
     * Flag to know whether a file was sent as the response. In this
     * case the response will be closed immediately once stream is
     * finished
     *
     * @attribute _sentFile
     *
     * @type {Boolean}
     * @private
     */
    this._sentFile = false
  }

  /**
   * lazyBody to be set as the response body.
   *
   * @method lazyBody
   *
   * @return {Object}
   */
  get lazyBody () {
    return this._lazyBody
  }

  /**
   * returns whether request has been
   * finished or not
   *
   * @attribute finished
   *
   * @return {Boolean}
   */
  get finished () {
    return this.response.finished
  }

  /**
   * returns whether request headers
   * have been sent or not
   *
   * @attribute headersSent
   *
   * @return {Boolean}
   */
  get headersSent () {
    return this.response.headersSent
  }

  /**
   * returns whether a request is pending
   * or not
   *
   * @attribute isPending
   *
   * @return {Boolean}
   */
  get isPending () {
    return (!this.headersSent && !this.finished)
  }

  /**
   * Set the response status code.
   *
   * @method status
   *
   * @param  {Number} statusCode
   *
   * @chainable
   */
  status (statusCode) {
    nodeRes.status(this.response, statusCode)
    return this
  }

  /**
   * Set HTTP response header. Resetting same header
   * multiple times will append to the existing
   * value.
   *
   * @method header
   *
   * @param  {String} key
   * @param  {String} value
   *
   * @chainable
   */
  header (key, value) {
    nodeRes.header(this.response, key, value)
    return this
  }

  /**
   * Set HTTP response header only if it does not
   * exists already
   *
   * @method safeHeader
   *
   * @param  {String}   key
   * @param  {String}   value
   *
   * @chainable
   */
  safeHeader (key, value) {
    nodeRes.safeHeader(this.response, key, value)
    return this
  }

  /**
   * Remove the existing HTTP response header.
   *
   * @method removeHeader
   *
   * @param  {String}     key
   *
   * @chainable
   */
  removeHeader (key) {
    nodeRes.removeHeader(this.response, key)
    return this
  }

  /**
   * Returns the value of header for a given key.
   *
   * @method getHeader
   *
   * @param  {String}  key
   *
   * @return {Mixed}
   */
  getHeader (key) {
    return nodeRes.getHeader(this.response, key)
  }

  /**
   * Stream a file to the client as HTTP response.
   *
   * Options are passed directly to [send](https://www.npmjs.com/package/send)
   *
   * @method download
   *
   * @param  {String} filePath
   * @param  {Object} options
   *
   * @return {void}
   */
  download (filePath, options = {}) {
    this._sentFile = true
    nodeRes.download(this.request, this.response, filePath, options)
  }

  /**
   * Force download the file by setting `Content-disposition`
   * header.
   *
   * @method attachment
   *
   * @param  {String}   filePath
   * @param  {String}   [name]
   * @param  {String}   [disposition]
   * @param  {Object}   [options = {}]
   *
   * @return {void}
   */
  attachment (filePath, name, disposition, options = {}) {
    this._sentFile = true
    nodeRes.attachment(this.request, this.response, filePath, name, disposition, options)
  }

  /**
   * Set the `Location` header on HTTP response.
   *
   * @method location
   *
   * @param  {String} url
   *
   * @chainable
   */
  location (url) {
    nodeRes.location(this.response, url)
    return this
  }

  /**
   * Redirect the request by setting the `Location`
   * header and ending the response
   *
   * @method redirect
   *
   * @param  {String} url
   * @param  {Number} [status = 302]
   *
   * @return {void}
   */
  redirect (url, status) {
    nodeRes.redirect(this.request, this.response, url, status)
  }

  /**
   * Add the HTTP `Vary` header
   *
   * @method vary
   *
   * @param  {String} field
   *
   * @chainable
   */
  vary (field) {
    nodeRes.vary(this.response, field)
    return this
  }

  /**
   * Sets the `Content-type` header based on the
   * type passed to this method.
   *
   * @method type
   *
   * @param  {String} type
   * @param  {String} [charset = 'utf-8']
   *
   * @chainable
   */
  type (type, charset = 'utf-8') {
    nodeRes.type(this.response, type, charset)
    return this
  }

  /**
   * Sets the response body for the HTTP request.
   *
   * @method send
   *
   * @param  {Mixed} body
   *
   * @return {void}
   */
  send (body) {
    this._lazyBody = {
      method: 'send',
      content: body,
      args: []
    }
  }

  /**
   * Sets the response body for the HTTP request with
   * explicit `content-type` set to `application/json`.
   *
   * @method json
   *
   * @param  {Object} body
   *
   * @return {void}
   */
  json (body) {
    this._lazyBody = {
      method: 'json',
      content: body,
      args: []
    }
  }

  /**
   * Sets the response body for the HTTP request with
   * explicit `content-type` set to `text/javascript`.
   *
   * @method jsonp
   *
   * @param  {Object} body
   * @param  {String} [callbackFn = 'callback'] - Callback name.
   *
   * @return {void}
   */
  jsonp (body, callbackFn) {
    callbackFn = callbackFn || nodeReq.get(this.request).callback || 'callback'
    this._lazyBody = {
      method: 'jsonp',
      content: body,
      args: [callbackFn]
    }
  }

  /**
   * Ends the response by setting the `_lazyBody` as the
   * response body.
   *
   * @method end
   *
   * @return {void}
   */
  end () {
    if (!this._sentFile) {
      const method = this._lazyBody.method || 'send'
      const args = [this.request, this.response, this._lazyBody.content].concat(this._lazyBody.args)
      nodeRes[method].apply(nodeRes, args)
    }
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
Response._macros = {}
Response._getters = {}

/**
 * Setting descriptive methods on the response prototype.
 */
nodeRes.descriptiveMethods.forEach((method) => {
  Response.prototype[method] = function (content) {
    this._lazyBody = { method, content, args: [] }
  }
})

module.exports = Response
