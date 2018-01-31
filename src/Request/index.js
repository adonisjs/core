'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * The Trust value is used to instruct Adonis whether or not to
 * trust **Proxy** specific specific. The value should be set
 * to true, whenever your server is behind a proxy server
 * like nginx.
 *
 * The value is read from the `app.js` file under config directory.
 * Check [proxy-addr](https://www.npmjs.com/package/proxy-addr)
 * to find list of all available inputs for the trust
 * property.
 *
 * @property Trust
 * @type {String|Boolean|Function|Array}
 */

const _ = require('lodash')
const nodeReq = require('node-req')
const nodeCookie = require('node-cookie')
const pathToRegexp = require('path-to-regexp')
const useragent = require('useragent')
const Macroable = require('macroable')

const SUBDOMAIN_OFFSET = 'app.http.subdomainOffset'
const TRUST_PROXY = 'app.http.trustProxy'
const SECRET = 'app.appKey'

/**
 * A facade over Node.js HTTP `req` object, making it
 * easier and simpler to access request information.
 * You can access the original **req** object as
 * `request.request`
 *
 * @binding Adonis/Src/Request
 * @group Http
 *
 * @class Request
 * @constructor
 */
class Request extends Macroable {
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
     * Reference to route params. This will be set by server
     * automatically once the route has been resolved.
     *
     * @attribute params
     * @type {Object}
     */
    this.params = {}

    /**
     * Reference to native HTTP response object
     *
     * @attribute response
     * @type {Object}
     */
    this.response = response

    /**
     * Reference to config provider to read
     * http specific settings.
     *
     * @attribute Config
     * @type {Object}
     */
    this.Config = Config

    /**
     * The qs object
     *
     * @type {Object}
     */
    this._qs = nodeReq.get(this.request)

    /**
     * Reference to request body
     *
     * @type {Object}
     */
    this._body = null

    /**
     * Reference to raw body
     *
     * @type {Object}
     */
    this._raw = null

    /**
     * A merged object of get and post
     *
     * @type {Object}
     */
    this._all = _.merge({}, this.get())
  }

  /**
   * Request body
   *
   * @method body
   *
   * @return {Object}
   */
  get body () {
    return this._body || {}
  }

  /**
   * Mutate request body, this method will
   * mutate the `all` object as well
   *
   * @method body
   *
   * @param  {Object} body
   *
   * @return {void}
   */
  set body (body) {
    this._body = body
    this._all = _.merge({}, this.get(), body)
  }

  /**
   * Returns a boolean indicating if user is a bad safari.
   * This method is used by the `fresh` method to address
   * a known bug in safari described [here](http://tech.vg.no/2013/10/02/ios7-bug-shows-white-page-when-getting-304-not-modified-from-server/)
   *
   * @method _isBadSafari
   *
   * @return {Boolean}
   *
   * @private
   */
  _isBadSafari () {
    const ua = this.header('user-agent')
    const cc = this.header('cache-control')

    return (useragent.is(ua).safari || useragent.is(ua).mobile_safari) && cc === 'max-age=0'
  }

  /**
   * Returns query params from HTTP url.
   *
   * @method get
   *
   * @return {Object}
   *
   * @example
   * ```js
   * request.get()
   * ```
   */
  get () {
    return this._qs
  }

  /**
   * Returns an object of request body. This method
   * does not parses the request body and instead
   * depends upon the body parser middleware
   * to set the private `_body` property.
   *
   * No it's not against the law of programming, since AdonisJs
   * by default is shipped with body parser middleware.
   *
   * @method post
   *
   * @return {Object}
   *
   * @example
   * ```js
   * request.body()
   * ```
   */
  post () {
    return this.body
  }

  /**
   * Returns an object after merging {{#crossLink "Request/get"}}{{/crossLink}} and
   * {{#crossLink "Request/post"}}{{/crossLink}} values
   *
   * @method all
   *
   * @return {Object}
   *
   * @example
   * ```js
   * request.all()
   * ```
   */
  all () {
    return this._all
  }

  /**
   * Returns request raw body
   *
   * @method raw
   *
   * @return {Object}
   */
  raw () {
    return this._raw
  }

  /**
   * Returns an array of key/value pairs for the defined keys.
   * This method is super helpful when your HTML forms sends
   * an array of values and you want them as individual
   * objects to be saved directly via Lucid models.
   *
   * # Note
   * This method always returns a stable array by setting value for
   * `undefined` keys to `null`. For example your data payload has
   * 3 emails and 2 usernames, the final array will have 3
   * objects with all the emails and the last object will
   * have `username` set to `null`.
   *
   * @method collect
   *
   * @param  {Array} keys
   *
   * @return {Array}
   *
   * @example
   * ```js
   * // data {username: ['virk', 'nikk'], age: [26, 25]}
   * const users = request.collect(['username', 'age'])
   * // returns [{username: 'virk', age: 26}, {username: 'nikk', age: 25}]
   * ```
   */
  collect (keys) {
    /**
     * Making sure to wrap strings as an array.
     */
    const selectedValues = _(this.only(keys)).values().map((value) => {
      return Array.isArray(value) ? value : [value]
    }).value()

    const values = _.zip.apply(_, selectedValues)

    return _.map(values, (item, index) => {
      return _.transform(keys, (result, k, i) => {
        result[keys[i]] = item[i] || null
        return result
      }, {})
    })
  }

  /**
   * Returns the value from the request body or
   * query string, but only for a single key.
   *
   * @method input
   *
   * @param {String} key
   * @param {Mixed}  [defaultValue]
   *
   * @return {Mixed} Actual value or the default value falling back to `null`
   */
  input (key, defaultValue) {
    return _.get(this.all(), key, defaultValue)
  }

  /**
   * Returns everything from request body and query
   * string except the given keys.
   *
   * @param {Array} keys
   *
   * @method except
   *
   * @return {Object}
   *
   * @example
   * ```js
   * request.except(['username', 'age'])
   * ```
   */
  except (keys) {
    return _.omit(this.all(), keys)
  }

  /**
   * Returns value for only given keys.
   *
   * @method only
   *
   * @param  {Array} keys
   *
   * @return {Object}
   *
   * @example
   * ```js
   * request.only(['username', 'age'])
   * ```
   */
  only (keys) {
    return _.pick(this.all(), keys)
  }

  /**
   * Returns the http request method, it will give preference
   * to spoofed method when `http.allowMethodSpoofing` is
   * enabled inside the `config/app.js` file.
   *
   * Make use of {{#crossLink "Request/intended"}}{{/crossLink}} to
   * get the actual method.
   *
   * @method method
   *
   * @return {String} Request method always in uppercase
   */
  method () {
    if (!this.Config.get('app.http.allowMethodSpoofing') || this.intended() !== 'POST') {
      return this.intended()
    }
    const method = this.input('_method', this.intended())
    return method.toUpperCase()
  }

  /**
   * Returns the intended method for HTTP request. This method
   * is useful when you have method spoofing enabled and wants
   * the actual request method.
   *
   * @method intended
   *
   * @return {String} Request method always in uppercase
   */
  intended () {
    return nodeReq.method(this.request)
  }

  /**
   * Returns HTTP request headers.
   *
   * @method headers
   *
   * @return {Object}
   */
  headers () {
    return nodeReq.headers(this.request)
  }

  /**
   * Returns header value for a given key.
   *
   * @method header
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue]
   *
   * @return {Mixed} Actual value or the default value, falling back to `null`
   */
  header (key, defaultValue) {
    return nodeReq.header(this.request, key) || defaultValue
  }

  /**
   * Returns the most trusted ip address for a given
   * HTTP request.
   *
   * @method ip
   *
   * @param {Trust} [trust = Config.get('app.http.trustProxy')]
   *
   * @return {String}
   */
  ip (trust = this.Config.get(TRUST_PROXY)) {
    return nodeReq.ip(this.request, trust)
  }

  /**
   * Returns an array of ips from most to the least trust one.
   * It will remove the default ip address, which can be
   * accessed via `ip` method.
   *
   * Also when trust is set to true, It will look into `X-Forwaded-For`
   * header to pull the ip address set by client or your proxy server.
   *
   * @method ips
   *
   * @param {Trust} [trust = Config.get('app.http.trustProxy')]
   *
   * @return {Array}
   */
  ips (trust = this.Config.get(TRUST_PROXY)) {
    return nodeReq.ips(this.request, trust)
  }

  /**
   * Returns the protocol for the request.
   *
   * @method protocol
   *
   * @param  {Trust} [trust = Config.get('app.http.trustProxy')]
   *
   * @return {String}
   */
  protocol (trust = this.Config.get(TRUST_PROXY)) {
    return nodeReq.protocol(this.request, trust)
  }

  /**
   * Returns a boolean indicating whether request is
   * on https or not
   *
   * @method secure
   *
   * @return {Boolean}
   */
  secure () {
    return nodeReq.secure(this.request)
  }

  /**
   * Returns an array of subdomains. It will exclude `www`
   * from the list.
   *
   * @method subdomains
   *
   * @param  {Trust}   [trust = Config.get('app.http.trustProxy')]
   * @param  {Number}  [offset = Config.get('app.http.subdomainOffset')]
   *
   * @return {Array}
   */
  subdomains (trust = this.Config.get(TRUST_PROXY, false), offset = this.Config.get(SUBDOMAIN_OFFSET, 2)) {
    return nodeReq.subdomains(this.request, trust, offset)
  }

  /**
   * Returns a boolean indicating whether request
   * is ajax or not.
   *
   * @method ajax
   *
   * @return {Boolean}
   */
  ajax () {
    return nodeReq.ajax(this.request)
  }

  /**
   * Returns a boolean indicating whether request
   * is pjax or not.
   *
   * @method pjax
   *
   * @return {Boolean}
   */
  pjax () {
    return nodeReq.pjax(this.request)
  }

  /**
   * Returns the hostname for the request
   *
   * @method hostname
   *
   * @param  {Mixed} [trust = Config.get('app.http.trustProxy')]
   *
   * @return {String}
   */
  hostname (trust = this.Config.get(TRUST_PROXY, false)) {
    return nodeReq.hostname(this.request, trust)
  }

  /**
   * Returns url without query string for the HTTP request.
   *
   * @method url
   *
   * @return {String}
   */
  url () {
    return nodeReq.url(this.request)
  }

  /**
   * Returns originalUrl for the HTTP request.
   *
   * @method originalUrl
   *
   * @return {String}
   */
  originalUrl () {
    return nodeReq.originalUrl(this.request)
  }

  /**
   * Check the request body type based upon http
   * `Content-type` header.
   *
   * @method is
   *
   * @param  {Array}  [types]
   *
   * @return {String}
   *
   * @example
   * ```js
   * // request.headers.content-type = 'application/json'
   *
   * request.is(['json']) // json
   * request.is(['json', 'html']) // json
   * request.is(['application/*']) // application/json
   *
   * request.is(['html']) // '<empty string>'
   * ```
   */
  is (types) {
    return nodeReq.is(this.request, types)
  }

  /**
   * Returns the best accepted response type based from
   * the `Accept` header. If no `types` are provided
   * the return value will be array containing all
   * the `Accept` header values.
   *
   * @method accepts
   *
   * @param  {Array} [types]
   *
   * @return {String|Array}
   */
  accepts (types) {
    return nodeReq.accepts(this.request, types) || ''
  }

  /**
   * Similar to `accepts`, but always returns an array of
   * values from `Accept` header, starting from most
   * preferred from least.
   *
   * @method types
   *
   * @return {Array}
   */
  types () {
    return nodeReq.types(this.request)
  }

  /**
   * Returns request language based upon HTTP `Accept-Language`
   * header. This method will filter from the list of
   * acceptedLanguages array.
   *
   * @method language
   *
   * @param  {Array} [acceptedLanguages]
   *
   * @return {String}
   */
  language (acceptedLanguages) {
    return nodeReq.language(this.request, acceptedLanguages)
  }

  /**
   * Returns an array of request languages based on HTTP `Accept-Language`
   * header.
   *
   * @method languages
   *
   * @return {Array}
   */
  languages () {
    return nodeReq.languages(this.request)
  }

  /**
   * Returns most preferred encoding based upon `Accept-Encoding`
   * header. This method will filter encodings based upon on
   * the acceptedEncodings string
   *
   * @method encoding
   *
   * @param  {Array} [acceptedEncodings]
   *
   * @return {String}
   */
  encoding (acceptedEncodings) {
    return nodeReq.encoding(this.request, acceptedEncodings)
  }

  /**
   * Returns an array of encodings based upon `Accept-Encoding`
   * header.
   *
   * @method encodings
   *
   * @return {Array}
   */
  encodings () {
    return nodeReq.encodings(this.request)
  }

  /**
   * Returns most preferred charset based upon the `Accept-Charset`
   * header. This method will filter from the list of acceptedCharsets
   * parameter.
   *
   * @method charset
   *
   * @param  {Array} acceptedCharsets
   *
   * @return {String}
   */
  charset (acceptedCharsets) {
    return nodeReq.charset(this.request, acceptedCharsets)
  }

  /**
   * Returns an array of charsets based upon `Accept-Charset`
   * header.
   *
   * @method charsets
   *
   * @return {Array}
   */
  charsets () {
    return nodeReq.charsets(this.request)
  }

  /**
   * Returns a boolean indicating whether request has
   * body or not
   *
   * @method hasBody
   *
   * @return {Boolean}
   */
  hasBody () {
    return nodeReq.hasBody(this.request)
  }

  /**
   * Returns an object of all the cookies. Make sure always
   * to define the `secret` inside `config/app.js` file,
   * since all cookies are signed and encrypted.
   *
   * This method will make use of `app.secret` from the config
   * directory.
   *
   * @method cookies
   *
   * @return {Object}
   */
  cookies () {
    return nodeCookie.parse(this.request, this.Config.get(SECRET), true)
  }

  /**
   * Returns cookies without decrypting or unsigning them
   *
   * @method plainCookies
   *
   * @return {Object}
   */
  plainCookies () {
    return nodeCookie.parse(this.request)
  }

  /**
   * Returns cookie value for a given key.
   *
   * This method will make use of `app.secret` from the config
   * directory.
   *
   * @method cookie
   *
   * @param  {String} key
   * @param  {Mixed} [defaultValue]
   *
   * @return {Mixed}
   */
  cookie (key, defaultValue) {
    return _.defaultTo(nodeCookie.get(this.request, key, this.Config.get(SECRET), true), defaultValue)
  }

  /**
   * Return raw value for a given key. Cookie will not be
   * encrypted or unsigned.
   *
   * @method plainCookie
   *
   * @param  {String}    key
   * @param  {Mixed}     [defaultValue]
   *
   * @return {Mixed}
   */
  plainCookie (key, defaultValue) {
    return _.defaultTo(nodeCookie.get(this.request, key), defaultValue)
  }

  /**
   * Returns a boolean indicating whether request url
   * matches any of the given route formats.
   *
   * @method match
   *
   * @param  {Array} routes
   *
   * @return {Boolean}
   *
   * @example
   * ```js
   * request.match(['/user/:id', 'user/(+.)'])
   * ```
   */
  match (routes) {
    if (!routes || !routes.length) {
      return false
    }

    const pattern = pathToRegexp(routes, [])
    return pattern.test(this.url())
  }

  /**
   * Returns the freshness of a response inside the client cache.
   * If client cache has the latest response, this method will
   * return true, otherwise it will return false.
   *
   *
   * Also when HTTP header Cache-Control: no-cache is present this method will return false everytime.
   *
   * @method fresh
   *
   * @return {Boolean}
   */
  fresh () {
    return !this._isBadSafari() ? nodeReq.fresh(this.request, this.response) : false
  }

  /**
   * The opposite of {{#crossLink "Request/fresh"}}{{/crossLink}} method.
   *
   * @method stale
   *
   * @return {Boolean}
   */
  stale () {
    return !this.fresh()
  }

  /**
   * Returns the request format from the URL params
   *
   * @method format
   *
   * @return {String}
   */
  format () {
    const { format } = this.params
    return format ? (typeof (format) === 'string' ? format.replace(/^\./, '') : format) : null
  }
}

/**
 * Defining _macros and _getters property
 * for Macroable class
 *
 * @type {Object}
 */
Request._macros = {}
Request._getters = {}

module.exports = Request
