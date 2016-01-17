'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const nodeReq = require('node-req')
const nodeCookie = require('node-cookie')
const File = require('../File')
const pathToRegexp = require('path-to-regexp')
const _ = require('lodash')
const CatLog = require('cat-log')
const log = new CatLog('adonis:framework')
const util = require('../../lib/util')

/**
 * @class  Request
 * @description instance is passed with every http request to
 * read request values in an unified way
 * @public
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
   * @description returns input value for a given
   * key from post and get values
   * @method input
   * @param  {String} key
   * @return {Mixed}
   * @public
   */
  input (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const input = this.all()
    return util.existy(input[key]) ? input[key] : defaultValue
  }

  /**
   * @description returns merged values from
   * get and post
   * @method all
   * @return {Object}
   * @public
   */
  all () {
    return _.merge(this.get(), this.post())
  }

  /**
   * @description returns all input values except defined
   * keys
   * @method except
   * @return {Object}
   * @public
   */
  except () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return _.omit(this.all(), args)
  }

  /**
   * @description returns values for defined keys only
   * @method only
   * @return {Object}
   * @public
   */
  only () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return _.pick(this.all(), args)
  }

  /**
   * @description returns query parameters
   * from request query
   * @method get
   * @return {Object}
   * @public
   */
  get () {
    return nodeReq.get(this.request)
  }

  /**
   * @description returns post body from request, BodyParser
   * middleware needs to be enabled for this to work
   * @method post
   * @return {Object}
   * @public
   */
  post () {
    return nodeReq.post(this.request) || {}
  }

  raw () {
    return this._raw
  }

  /**
   * @description returns header value for a given key
   * @method header
   * @param  {String} key
   * @return {Mixed}
   * @public
   */
  header (key) {
    return nodeReq.header(this.request, key)
  }

  /**
   * @description returns all request headers
   * @method headers
   * @return {Object}
   * @public
   */
  headers () {
    return nodeReq.headers(this.request)
  }

  /**
   * @description tells whether request is fresh or not by
   * checking Etag and expires header
   * @method fresh
   * @return {Boolean}
   * @public
   */
  fresh () {
    return nodeReq.fresh(this.request, this.response)
  }

  /**
   * @description opposite of fresh
   * @see  fresh
   * @method stale
   * @return {Boolean}
   * @public
   */
  stale () {
    return nodeReq.stale(this.request, this.response)
  }

  /**
   * @description returns most trusted ip address
   * @method ip
   * @return {String}
   * @public
   */
  ip () {
    return nodeReq.ip(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * @description returns an array of ip addresses sorted from
   * most to least trusted
   * @method ips
   * @return {Array}
   * @public
   */
  ips () {
    return nodeReq.ips(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * @description tells whether request is on https
   * or not
   * @method secure
   * @return {Boolean}
   * @public
   */
  secure () {
    return nodeReq.secure(this.request)
  }

  /**
   * @description returns a array of subdomains from url
   * @method subdomains
   * @return {Array}
   * @public
   */
  subdomains () {
    return nodeReq.subdomains(this.request, this.config.get('app.http.trustProxy'), this.config.get('app.http.subdomainOffset'))
  }

  /**
   * @description tells whether request is an ajax
   * request or not
   * @method ajax
   * @return {Boolean}
   * @public
   */
  ajax () {
    return nodeReq.ajax(this.request)
  }

  /**
   * @description tells whether request is pjax or
   * not based on X-PJAX header
   * @method pjax
   * @return {Boolean}
   */
  pjax () {
    return nodeReq.pjax(this.request)
  }

  /**
   * @description returns request hostname
   * @method hostname
   * @return {String}
   * @public
   */
  hostname () {
    return nodeReq.hostname(this.request, this.config.get('app.http.trustProxy'))
  }

  /**
   * @description returns request url without
   * query string
   * @method url
   * @return {String}
   * @public
   */
  url () {
    return nodeReq.url(this.request)
  }

  /**
   * @description returns request original Url
   * with query string
   * @method originalUrl
   * @return {String}
   * @public
   */
  originalUrl () {
    return nodeReq.originalUrl(this.request)
  }

  /**
   * @description tells whether request is of certain type
   * based upon Content-type header
   * @method is
   * @return {Boolean}
   * @public
   */
  is () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return nodeReq.is(this.request, args)
  }

  /**
   * @description returns the best response type to be accepted
   * using Accepts header
   * @method accepts
   * @return {String}
   * @public
   */
  accepts () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    return nodeReq.accepts(this.request, args)
  }

  /**
   * @description returns request method or verb in HTTP terms
   * @method method
   * @return {String}
   * @public
   */
  method () {
    return nodeReq.method(this.request)
  }

  /**
   * @description returns cookie value for a given key
   * @method cookie
   * @param  {String} key
   * @return {Mixed}
   * @public
   */
  cookie (key) {
    const cookies = this.cookies()
    return cookies[key] || null
  }

  /**
   * @description returns all cookies associated to a
   * given request
   * @method cookies
   * @return {Object}
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
   * @description  return route param value for a given key
   * @method param
   * @param  {String} key
   * @return {Mixed}
   * @public
   */
  param (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    return util.existy(this.params()[key]) ? this.params()[key] : defaultValue
  }

  /**
   * @description returns all route params
   * @method params
   * @return {Object}
   * @public
   */
  params () {
    return this._params || {}
  }

  /**
   * @description converts a file object to file instance
   * if already is not an instance
   * @method _toFileInstance
   * @param  {Object}        file
   * @return {Object}
   * @private
   */
  _toFileInstance (file) {
    if (!(file instanceof File)) {
      file = new File(file)
    }
    return file
  }

  /**
   * @description converts an uploaded file to file
   * instance
   * @method file
   * @param  {String} key
   * @return {Object}
   * @public
   */
  file (key) {
    /**
     * if requested file was not uploaded return an
     * empty instance of file object.
     */
    if (!this._files[key]) {
      return this._toFileInstance({})
    }

    /**
     * grabbing file from uploaded files and
     * converting them to file instance
     */
    const fileToReturn = this._files[key].toJSON()

    /**
     * if multiple file upload , convert of them to
     * file instance
     */
    if (_.isArray(fileToReturn)) {
      return _.map(fileToReturn, (file) => {
        return this._toFileInstance(file)
      })
    }
    return this._toFileInstance(fileToReturn)
  }

  /**
   * @description returns all uploded files by converting
   * them to file instances
   * @method files
   * @return {Array}
   * @public
   */
  files () {
    return _.map(this._files, (file, index) => {
      return this.file(index)
    })
  }

  /**
   * @description flash an object of messages to upcoming
   * request
   * @method flash
   * @param  {Object} values
   * @return {void}
   * @public
   */
  * flash (values) {
    if (typeof (values) !== 'object') {
      throw new Error('Flash values should be an object')
    }
    yield this.session.put('flash_messages', values)
  }

  /**
   * @description return values set via flash from
   * request session
   * @method old
   * @param  {String} key
   * @param  {Mixed} defaultValue
   * @return {Mixed}
   * @public
   */
  old (key, defaultValue) {
    if (!this._flash_messages) {
      log.warn('Make use of Flash middleware to enable flash messaging')
      this._flash_messages = {}
    }
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    return util.existy(this._flash_messages[key]) ? this._flash_messages[key] : defaultValue
  }

  /**
   * @description flash all request input fields to
   * session flash
   * @method flashAll
   * @return {void}
   * @public
   */
  * flashAll () {
    yield this.flash(this.all())
  }

  /**
   * @description flash values of request keys from request
   * input field to session flash
   * @method flashOnly
   * @return {void}
   * @public
   */
  * flashOnly () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    yield this.flash(this.only(args))
  }

  /**
   * @description flash values of request to session flash
   * except defined keys
   * @method flashExcept
   * @return {void}
   * @public
   */
  * flashExcept () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    yield this.flash(this.except(args))
  }

  /**
   * @description tells whether a given pattern matches the
   * current url or not
   * @method match
   * @param  {String} pattern
   * @return {Boolean}
   * @public
   */
  match () {
    const args = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments)
    const url = this.url()
    const pattern = pathToRegexp(args, [])
    return pattern.test(url)
  }

}

module.exports = Request
