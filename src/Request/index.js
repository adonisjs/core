'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nodeReq = require('node-req')
const nodeCookie = require('node-cookie')
const File = require('../File')
const pathToRegexp = require('path-to-regexp')
const _ = require('lodash')
const util = require('../../lib/util')

/**
 * Glued http request object to read values for
 * a given request. Instance of this class
 * is generated automatically on every
 * new request.
 * @class
 */
class Request {

  constructor (request, response, Config) {
    this.request = request
    this.response = response
    this.config = Config
    this._body = {}
    this._files = []

    /**
     * secret to parse and decrypt cookies
     * @type {String}
     */
    this.secret = this.config.get('app.appKey')

    /**
     * holding references to cookies once they
     * have been parsed. It is required to
     * optimize performance as decrypting
     * is an expensive operation
     * @type {Object}
     */
    this.cookiesObject = {}

    /**
     * flag to find whether cookies have been
     * parsed once or not
     * @type {Boolean}
     */
    this.parsedCookies = false
  }

  /**
   * returns input value for a given key from post
   * and get values.
   *
   * @param  {String} key - Key to return value for
   * @param  {Mixed} defaultValue - default value to return when actual
   *                                 value is empty
   * @return {Mixed}
   *
   * @example
   * request.input('name')
   * request.input('profile.name')
   *
   * @public
   */
  input (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const input = this.all()
    const value = _.get(input, key)
    return util.existy(value) ? value : defaultValue
  }

  /**
   * returns merged values from get and post methods.
   *
   * @return {Object}
   *
   * @public
   */
  all () {
    return _.merge(this.get(), this.post())
  }

  /**
   * returns all input values except defined keys
   *
   * @param {Mixed} keys an array of keys or multiple keys to omit values for
   * @return {Object}
   *
   * @example
   * request.except('password', 'credit_card')
   * request.except(['password', 'credit_card'])
   *
   * @public
   */
  except () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return _.omit(this.all(), args)
  }

  /**
   * returns all input values for defined keys only
   *
   * @param {Mixed} keys an array of keys or multiple keys to pick values for
   * @return {Object}
   *
   * @example
   * request.only('name', 'email')
   * request.only(['name', 'name'])
   *
   * @public
   */
  only () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return _.pick(this.all(), args)
  }

  /**
   * returns a group of objects with defined keys and values
   * corresponding to them. It is helpful when accepting
   * an array of values via form submission.
   *
   * @param {Mixed} keys an array of keys or multiple keys to pick values for
   * @return {Array}
   *
   * @example
   * request.collect('name', 'email')
   * request.collect(['name', 'email'])
   *
   * @public
   */
  collect () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    const selectedValues = this.only(args)

    /**
     * need to make sure the values array is in balance to the expected
     * array. Otherwise map method will pickup values for wrong keys.
     */
    if (_.size(args) > _.size(selectedValues)) {
      args.forEach((key) => { selectedValues[key] = selectedValues[key] || [] })
    }

    const keys = _.keys(selectedValues)
    const values = _.zip.apply(_, _.values(selectedValues))
    return _.map(values, (item, index) => {
      const group = {}
      _.each(args, (k, i) => { group[keys[i]] = item[i] || null })
      return group
    })
  }

  /**
   * returns query parameters from request querystring
   *
   * @return {Object}
   *
   * @public
   */
  get () {
    return nodeReq.get(this.request)
  }

  /**
   * returns post body from request, BodyParser
   * middleware needs to be enabled for this to work
   *
   * @return {Object}
   *
   * @public
   */
  post () {
    return this._body || {}
  }

  /**
   * returns header value for a given key
   *
   * @param  {String} key
   * @param  {Mixed} defaultValue - default value to return when actual
   *                                 value is undefined or null
   * @return {Mixed}
   *
   * @example
   * request.header('Authorization')
   *
   * @public
   */
  header (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const headerValue = nodeReq.header(this.request, key)
    return util.existy(headerValue) ? headerValue : defaultValue
  }

  /**
   * returns all request headers from a given request
   *
   * @return {Object}
   *
   * @public
   */
  headers () {
    return nodeReq.headers(this.request)
  }

  /**
   * tells whether request is fresh or not by
   * checking Etag and expires header
   *
   * @return {Boolean}
   *
   * @public
   */
  fresh () {
    return nodeReq.fresh(this.request, this.response)
  }

  /**
   * opposite of fresh
   *
   * @see fresh
   *
   * @return {Boolean}
   *
   * @public
   */
  stale () {
    return nodeReq.stale(this.request, this.response)
  }

  /**
   * returns most trusted ip address for a given request. Proxy
   * headers are trusted only when app.http.trustProxy is
   * enabled inside config file.
   *
   * @uses app.http.subdomainOffset
   *
   * @return {String}
   *
   * @public
   */
  ip () {
    return nodeReq.ip(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * returns an array of ip addresses sorted from most to
   * least trusted. Proxy headers are trusted only when
   * app.http.trustProxy is enabled inside config file.
   *
   * @uses app.http.subdomainOffset
   *
   * @return {Array}
   *
   * @public
   */
  ips () {
    return nodeReq.ips(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * tells whether request is on https or not
   *
   * @return {Boolean}
   *
   * @public
   */
  secure () {
    return nodeReq.secure(this.request)
  }

  /**
   * returns an array of subdomains from url. Proxy headers
   * are trusted only when app.http.trustProxy is enabled
   * inside config file.
   *
   * @uses app.http.subdomainOffset
   * @uses app.http.trustProxy
   *
   * @return {Array}
   *
   * @public
   */
  subdomains () {
    return nodeReq.subdomains(this.request, this.config.get('app.http.trustProxy'), this.config.get('app.http.subdomainOffset'))
  }

  /**
   * tells whether request is an ajax request or not
   *
   * @return {Boolean}
   *
   * @public
   */
  ajax () {
    return nodeReq.ajax(this.request)
  }

  /**
   * tells whether request is pjax or
   * not based on X-PJAX header
   *
   * @return {Boolean}
   *
   * @public
   */
  pjax () {
    return nodeReq.pjax(this.request)
  }

  /**
   * returns request hostname
   *
   * @uses app.http.subdomainOffset
   *
   * @return {String}
   *
   * @public
   */
  hostname () {
    return nodeReq.hostname(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * returns request url without query string
   *
   * @return {String}
   *
   * @public
   */
  url () {
    return nodeReq.url(this.request)
  }

  /**
   * returns request original Url with query string
   *
   * @return {String}
   *
   * @public
   */
  originalUrl () {
    return nodeReq.originalUrl(this.request)
  }

  /**
   * tells whether request is of certain type
   * based upon Content-type header
   *
   * @return {Boolean}
   *
   * @example
   * request.is('text/html', 'text/plain')
   * request.is(['text/html', 'text/plain'])
   *
   * @public
   */
  is () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return nodeReq.is(this.request, args)
  }

  /**
   * returns the best response type to be accepted using Accepts header
   *
   * @return {String}
   *
   * @example
   * request.accepts('text/html', 'application/json')
   * request.accepts(['text/html', 'application/json'])
   *
   * @public
   */
  accepts () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return nodeReq.accepts(this.request, args)
  }

  /**
   * returns request method or verb in HTTP terms
   *
   * @return {String}
   *
   * @public
   */
  method () {
    if (!this.config.get('app.http.allowMethodSpoofing')) {
      return nodeReq.method(this.request)
    }
    return this.input('_method', this.intended())
  }

  /**
   * Returns the original HTTP request method, regardless
   * of the spoofing input.
   *
   * @returns {String}
   */
  intended () {
    return nodeReq.method(this.request)
  }

  /**
   * returns cookie value for a given key
   *
   * @param  {String} key - Key for which value should be returnd
   * @param  {Mixed} defaultValue - default value to return when actual
   *                                 value is undefined or null
   * @return {Mixed}
   *
   * @public
   */
  cookie (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const cookies = this.cookies()
    return util.existy(cookies[key]) ? cookies[key] : defaultValue
  }

  /**
   * returns all cookies associated to a given request
   *
   * @return {Object}
   *
   * @public
   */
  cookies () {
    const secret = this.secret || null
    const decrypt = !!this.secret

    /**
     * avoiding re-parsing of cookies if done once
     */
    if (!this.parsedCookies) {
      this.cookiesObject = nodeCookie.parse(this.request, secret, decrypt)
      this.parsedCookies = true
    }

    return this.cookiesObject
  }

  /**
   * Returns an object of plain cookies without decrypting
   * or unsigning them. It is required and helpful when
   * want to read cookies not set by AdonisJs.
   *
   * @return {Object}
   */
  plainCookies () {
    return nodeCookie.parse(this.request)
  }

  /**
   * Returns plain cookie value without decrypting or
   * unsigning it. It is required and helpful when
   * want to read cookies not set by AdonisJs.
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue]
   *
   * @return {Mixed}
   */
  plainCookie (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const cookies = this.plainCookies()
    return util.existy(cookies[key]) ? cookies[key] : defaultValue
  }

  /**
   * return route param value for a given key
   *
   * @param  {String} key - key for which the value should be return
   * @param {Mixed} defaultValue - default value to be returned with actual
   *                               is null or undefined
   * @return {Mixed}
   *
   * @public
   */
  param (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    return util.existy(this.params()[key]) ? this.params()[key] : defaultValue
  }

  /**
   * returns all route params
   *
   * @return {Object}
   *
   * @public
   */
  params () {
    return this._params || {}
  }

  /**
   * converts a file object to file instance
   * if already is not an instance
   *
   * @param  {Object}        file
   * @param  {Object} [options]
   * @return {Object}
   * @private
   */
  _toFileInstance (file, options) {
    if (!(file instanceof File)) {
      file = new File(file, options)
    }
    return file
  }

  /**
   * returns uploaded file instance for a given key
   * @instance Request.file
   *
   * @param  {String} key
   * @param  {Objecr} [options]
   * @return {Object}
   *
   * @example
   * request.file('avatar')
   * @public
   */
  file (key, options) {
    /**
     * if requested file was not uploaded return an
     * empty instance of file object.
     */
    if (!this._files[key]) {
      return null
    }

    /**
     * grabbing file from uploaded files and
     * converting them to file instance
     */
    const fileToReturn = this._files[key]

    /**
     * if multiple file upload , convert them to
     * file instances
     */
    if (_.isArray(fileToReturn)) {
      return _.map(fileToReturn, (file) => this._toFileInstance(file.toJSON(), options))
    }
    return this._toFileInstance(fileToReturn.toJSON(), options)
  }

  /**
   * returns all uploded files by converting
   * them to file instances
   *
   * @return {Array}
   *
   * @public
   */
  files () {
    return _.map(this._files, (file, index) => {
      return this.file(index)
    })
  }

  /**
   * tells whether a given pattern matches the current url or not
   *
   * @param  {String} pattern
   * @return {Boolean}
   *
   * @example
   * request.match('/user/:id', 'user/(+.)')
   * request.match(['/user/:id', 'user/(+.)'])
   *
   * @public
   */
  match () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    const url = this.url()
    const pattern = pathToRegexp(args, [])
    return pattern.test(url)
  }

  /**
   * returns request format enabled by using
   * .formats on routes
   *
   * @return {String}
   *
   * @example
   * request.format()
   *
   * @public
   */
  format () {
    return this.param('format') ? this.param('format').replace('.', '') : null
  }

  /**
   * tells whether or not request has body. It can be
   * used by bodyParsers to decide whether or not to parse body
   *
   * @return {Boolean}
   *
   * @public
   */
  hasBody () {
    return nodeReq.hasBody(this.request)
  }

  /**
   * adds a new method to the request prototype
   *
   * @param  {String}   name
   * @param  {Function} callback
   *
   * @public
   */
  static macro (name, callback) {
    this.prototype[name] = callback
  }
}

module.exports = Request
