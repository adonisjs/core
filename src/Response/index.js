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
const nodeCookie = require('node-cookie')
const Macroable = require('macroable')
const parseurl = require('parseurl')
const GE = require('@adonisjs/generic-exceptions')
const RouteManager = require('../Route/Manager')

/**
 * Abort exception is raised when `response.abortIf` or
 * `response.abortUnless` called.
 *
 * @class AbortException
 * @constructor
 */
class AbortException extends GE.HttpException {
  /**
   * Return error object with body and status
   *
   * @method invoke
   *
   * @param  {String} [body = 'Request aborted']
   * @param  {Number} [status = 400]
   *
   * @return {AbortException}
   */
  static invoke (body, status) {
    const error = new this('Request aborted', status || 400)
    error.body = body || 'Request aborted'
    return error
  }

  /**
   * Handling the exception itself.
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.response
   * @param  {Object} options.session
   *
   * @return {void}
   */
  async handle (error, { response, session }) {
    /**
     * Commit session when in use
     */
    if (session && typeof (session.commit) === 'function') {
      await session.commit()
    }

    response.status(error.status).send(error.body)
  }
}

const SECRET = 'app.appKey'
const JSONPCALLBACK = 'app.http.jsonpCallback'

/**
 * A facade over Node.js HTTP `res` object, making it
 * easier and simpler to make HTTP response. You can
 * access the original **response** object as
 * `response.response`
 *
 * @binding Adonis/Src/Response
 * @group Http
 *
 * @class Response
 */
class Response extends Macroable {
  constructor (request, response, Config) {
    super()
    /**
     * Reference to native HTTP request object
     *
     * @attribute request
     * @type {Object}
     */
    this.request = request

    /**
     * Reference to native HTTP response object
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
     * Implicitly end the response. If you set it
     * to false, calling `response.end` will
     * end the response.
     *
     * @type {Boolean}
     */
    this.implicitEnd = true

    this.Config = Config
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
    this.implicitEnd = false
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
    this.implicitEnd = false
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
   * @param  {Boolean} [sendParams = false]
   * @param  {Number} [status = 302]
   *
   * @return {void}
   */
  redirect (url, sendParams = false, status = 302) {
    if (url === 'back') {
      url = nodeReq.header(this.request, 'referrer') || '/'
    }

    /**
     * Send query params of the current URL back when
     * redirect to a new url
     */
    if (sendParams) {
      const { query } = parseurl(this.request)
      url = `${url}?${query}`
    }

    if (!this.implicitEnd) {
      nodeRes.redirect(this.request, this.response, url, status)
      return
    }

    this._lazyBody = {
      method: 'redirect',
      content: url,
      args: [status]
    }
  }

  /**
   * Redirect to a specific route
   *
   * @method route
   *
   * @param  {String} routeNameOrHandler
   * @param  {Object} [data = {}]
   * @param  {String} [domain]
   * @param  {Boolean} [sendParams = false]
   * @param  {Number} [status = 302]
   *
   * @return {void}
   */
  route (routeNameOrHandler, data, domain, sendParams = false, status = 302) {
    const url = RouteManager.url(routeNameOrHandler, data, domain) || routeNameOrHandler
    return this.redirect(url, sendParams, status)
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
   * @param  {*} body
   * @param  {Object} options
   * @param  {Boolean} options.ignoreETag
   *
   * @return {void}
   */
  send (body, options) {
    const clonedOptions = Object.assign({
      ignoreEtag: !this.Config.get('app.http.etag', true)
    }, options)

    if (!this.implicitEnd) {
      nodeRes.send(this.request, this.response, body, clonedOptions)
      return
    }

    this._lazyBody = {
      method: 'send',
      content: body,
      args: [clonedOptions]
    }
  }

  /**
   * Sets the response body for the HTTP request with
   * explicit `content-type` set to `application/json`.
   *
   * @method json
   *
   * @param  {Object} body
   * @param  {Object} options
   * @param  {Boolean} options.ignoreETag
   *
   * @return {void}
   */
  json (body, options) {
    const clonedOptions = Object.assign({
      ignoreEtag: !this.Config.get('app.http.etag', true)
    }, options)

    if (!this.implicitEnd) {
      nodeRes.json(this.request, this.response, body, clonedOptions)
      return
    }

    this._lazyBody = {
      method: 'json',
      content: body,
      args: [clonedOptions]
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
   * @param  {Object} options
   * @param  {Boolean} options.ignoreETag
   *
   * @return {void}
   */
  jsonp (body, callbackFn, options) {
    const clonedOptions = Object.assign({
      ignoreEtag: !this.Config.get('app.http.etag', true)
    }, options)

    callbackFn = callbackFn || nodeReq.get(this.request).callback || this.Config.get(JSONPCALLBACK)

    if (!this.implicitEnd) {
      nodeRes.jsonp(this.request, this.response, body, callbackFn, clonedOptions)
      return
    }

    this._lazyBody = {
      method: 'jsonp',
      content: body,
      args: [callbackFn, clonedOptions]
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
    if (this.implicitEnd) {
      const method = this._lazyBody.method || 'send'
      const args = [this.request, this.response, this._lazyBody.content].concat(this._lazyBody.args)
      nodeRes[method](...args)
    }
  }

  /**
   * Send cookie with the http response
   *
   * @method cookie
   *
   * @param  {String} key
   * @param  {Mixed} value
   * @param  {Object} [options = {}]
   *
   * @return {void}
   */
  cookie (key, value, options = {}) {
    nodeCookie.create(this.response, key, value, options, this.Config.get(SECRET), true)
  }

  /**
   * Set plain cookie HTTP response
   *
   * @method plainCookie
   *
   * @param  {String}    key
   * @param  {Mixed}    value
   * @param  {Object}    [options = {}]
   *
   * @return {void}
   */
  plainCookie (key, value, options) {
    nodeCookie.create(this.response, key, value, options)
  }

  /**
   * Remove existing cookie using it's key
   *
   * @method clearCookie
   *
   * @param  {String}    key
   *
   * @return {void}
   */
  clearCookie (key) {
    nodeCookie.clear(this.response, key)
  }

  /**
   * Aborts the request (when expression is truthy) by throwing an exception.
   * Since AdonisJs allows exceptions to handle themselves, it simply makes
   * an response when handling itself.
   *
   * @method abortIf
   *
   * @param  {Mixed} expression
   * @param  {Number} status
   * @param  {Mixed} body
   *
   * @return {void}
   *
   * @throws {AbortException} If expression is thruthy
   */
  abortIf (expression, status, body) {
    const value = typeof (expression) === 'function' ? expression() : expression
    if (value) {
      throw AbortException.invoke(body, status)
    }
  }

  /**
   * Aborts the request (when expression is falsy) by throwing an exception.
   * Since AdonisJs allows exceptions to handle themselves, it simply makes
   * an response when handling itself.
   *
   * @method abortUnless
   *
   * @param  {Mixed} expression
   * @param  {Number} status
   * @param  {Mixed} body
   *
   * @return {void}
   *
   * @throws {AbortException} If expression is falsy
   */
  abortUnless (expression, status, body) {
    const value = typeof (expression) === 'function' ? expression() : expression
    if (!value) {
      throw AbortException.invoke(body, status)
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
    if (!this.implicitEnd) {
      nodeRes[method](this.request, this.response, content)
      return
    }
    this._lazyBody = { method, content, args: [] }
  }
})

module.exports = Response
