/**
 * @module Http.Request
 */

/*
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { parse, UrlWithStringQuery } from 'url'
import { ServerResponse, IncomingMessage, IncomingHttpHeaders } from 'http'
import { omit, pick } from 'lodash'
import * as getValue from 'get-value'
import * as qs from 'qs'
import * as proxyaddr from 'proxy-addr'
import { isIP } from 'net'
import * as typeIs from 'type-is'
import * as accepts from 'accepts'
import * as fresh from 'fresh'
import { Macroable } from 'macroable'

import { RequestContract, RequestConfig } from './RequestContract'

/**
 * HTTP Request class exposes the interface to consistently read values
 * related to a given HTTP request. The class is wrapper over
 * [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
 * and has extended API.
 *
 * You can access the original [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
 * using `request.request` property.
 */
export class Request extends Macroable implements RequestContract {
  /**
   * Parses copy of the URL with query string as a string and not
   * object. This is done to build URL's with query string without
   * stringifying the object
   */
  public parsedUrl: UrlWithStringQuery = parse(this.request.url!, false)

  /**
   * Request body set using `setBody` method
   */
  private _body: any = {}

  /**
   * A merged copy of `request` body and `querystring`
   */
  private _all: any = {}

  /**
   * Original merged copy of `request body` and `querystring`.
   * Further mutation to this object are not allowed
   */
  private _original: any = {}

  /**
   * Parsed query string
   */
  private _qs: any = {}

  /**
   * Raw request body as text
   */
  private _raw: string | null = null

  /**
   * Cached copy of `accepts` fn to do content
   * negotiation.
   */
  private _lazyAccepts: any = null

  protected static _macros = {}
  protected static _getters = {}

  constructor (
    public request: IncomingMessage,
    public response: ServerResponse,
    private _config: RequestConfig,
  ) {
    super()
    this._parseQueryString()
  }

  /**
   * Parses the query string
   */
  private _parseQueryString () {
    if (this.parsedUrl.query) {
      this.updateQs(qs.parse(this.parsedUrl.query))
      this._original = { ...this._all }
    }
  }

  /**
   * Lazily initiates the `accepts` module to make sure to parse
   * the request headers only when one of the content-negotiation
   * methods are used.
   */
  private _initiateAccepts () {
    this._lazyAccepts = this._lazyAccepts || accepts(this.request)
  }

  /**
   * Set initial request body. A copy of the input will be maintained as the original
   * request body. Since the request body and query string is subject to mutations, we
   * keep one original reference to flash old data (whenver required).
   *
   * This method is supposed to be invoked by the body parser and must be called only
   * once. For further mutations make use of `updateBody` method.
   */
  public setInitialBody (body) {
    if (this._original && Object.isFrozen(this._original)) {
      throw new Error('Cannot re-set initial body. Use request.updateBody instead')
    }

    this.updateBody(body)

    /**
     * Freeze the original object
     */
    this._original = Object.freeze({ ...this._all })
  }

  /**
   * Update the request body with new data object. The `all` property
   * will be re-computed by merging the query string and request
   * body.
   */
  public updateBody (body) {
    this._body = body
    this._all = { ...this._body, ...this._qs }
  }

  /**
   * Update the request raw body. Bodyparser sets this when unable to parse
   * the request body or when request is multipart/form-data.
   */
  public updateRawBody (rawBody: string) {
    this._raw = rawBody
  }

  /**
   * Update the query string with the new data object. The `all` property
   * will be re-computed by merging the query and the request body.
   */
  public updateQs (data) {
    this._qs = data
    this._all = { ...this._body, ...this._qs }
  }

  /**
   * Returns reference to the query string object
   */
  public get (): { [key: string]: any } {
    return this._qs
  }

  /**
   * Returns reference to the request body
   */
  public post (): { [key: string]: any } {
    return this._body
  }

  /**
   * Returns reference to the merged copy of request body
   * and query string
   */
  public all (): { [key: string]: any } {
    return this._all
  }

  /**
   * Returns reference to the merged copy of original request
   * query string and body
   */
  public original (): { [key: string]: any } {
    return this._original
  }

  /**
   * Returns the request raw body (if exists), or returns `null`.
   *
   * Ideally you must be dealing with the parsed body accessed using [[input]], [[all]] or
   * [[post]] methods. The `raw` body is always a string.
   */
  public raw (): string | null {
    return this._raw
  }

  /**
   * Returns value for a given key from the request body or query string.
   * The `defaultValue` is used when original value is `undefined`.
   *
   * @example
   * ```js
   * request.input('username')
   *
   * // with default value
   * request.input('username', 'virk')
   * ```
   */
  public input (key: string, defaultValue?: any): any {
    return getValue(this._all, key, { default: defaultValue })
  }

  /**
   * Get everything from the request body except the given keys.
   *
   * @example
   * ```js
   * request.except(['_csrf'])
   * ```
   */
  public except (keys: string[]): { [key: string]: any } {
    return omit(this._all, keys)
  }

  /**
   * Get value for specified keys.
   *
   * @example
   * ```js
   * request.only(['username', 'age'])
   * ```
   */
  public only <T extends string, U = { [K in T]: any }> (keys: T[]): U {
    return pick(this._all, keys) as unknown as U
  }

  /**
   * Returns the HTTP request method. This is the original
   * request method. For spoofed request method, make
   * use of [[method]].
   *
   * @example
   * ```js
   * request.intended()
   * ```
   */
  public intended (): string {
    return this.request.method!
  }

  /**
   * Returns the request HTTP method by taking method spoofing into account.
   *
   * Method spoofing works when all of the following are true.
   *
   * 1. `app.http.allowMethodSpoofing` config value is true.
   * 2. request query string has `_method`.
   * 3. The [[intended]] request method is `POST`.
   *
   * @example
   * ```js
   * request.method()
   * ```
   */
  public method (): string {
    if (this._config.allowMethodSpoofing && this.intended() === 'POST') {
      return this.input('_method', this.intended()).toUpperCase()
    }

    return this.intended()
  }

  /**
   * Returns a copy of headers as an object
   */
  public headers (): IncomingHttpHeaders {
    return this.request.headers
  }

  /**
   * Returns value for a given header key. The default value is
   * used when original value is `undefined`.
   */
  public header (key: string, defaultValue?: any): string | undefined {
    key = key.toLowerCase()
    const headers = this.headers()

    switch (key) {
      case 'referer':
      case 'referrer':
        return headers.referrer || headers.referer || defaultValue
      default:
        return headers[key] || defaultValue
    }
  }

  /**
   * Returns the ip address of the user. This method is optimize to fetch
   * ip address even when running your AdonisJs app behind a proxy.
   *
   * You can also define your own custom function to compute the ip address by
   * defining `app.http.getIp` as a function inside the config file.
   *
   * ```js
   * {
   *   http: {
   *     getIp (request) {
   *       // I am using nginx as a proxy server and want to trust 'x-real-ip'
   *       return request.header('x-real-ip')
   *     }
   *   }
   * }
   * ```
   *
   * You can control the behavior of trusting the proxy values by defining it
   * inside the `config/app.js` file.
   *
   * ```js
   * {
   *   http: {
   *    trustProxy: '127.0.0.1'
   *   }
   * }
   * ```
   *
   * The value of trustProxy is passed directly to [proxy-addr](https://www.npmjs.com/package/proxy-addr)
   */
  public ip (): string {
    const ipFn = this._config.getIp
    if (typeof (ipFn) === 'function') {
      return ipFn(this)
    }

    return proxyaddr(this.request, this._config.trustProxy)
  }

  /**
   * Returns an array of ip addresses from most to least trusted one.
   * This method is optimize to fetch ip address even when running
   * your AdonisJs app behind a proxy.
   *
   * You can control the behavior of trusting the proxy values by defining it
   * inside the `config/app.js` file.
   *
   * ```js
   * {
   *   http: {
   *    trustProxy: '127.0.0.1'
   *   }
   * }
   * ```
   *
   * The value of trustProxy is passed directly to [proxy-addr](https://www.npmjs.com/package/proxy-addr)
   */
  public ips (): string[] {
    return proxyaddr.all(this.request, this._config.trustProxy)
  }

  /**
   * Returns the request protocol by checking for the URL protocol or
   * `X-Forwarded-Proto` header.
   *
   * If the `trust` is evaluated to `false`, then URL protocol is returned,
   * otherwise `X-Forwarded-Proto` header is used (if exists).
   *
   * You can control the behavior of trusting the proxy values by defining it
   * inside the `config/app.js` file.
   *
   * ```js
   * {
   *   http: {
   *    trustProxy: '127.0.0.1'
   *   }
   * }
   * ```
   *
   * The value of trustProxy is passed directly to [proxy-addr](https://www.npmjs.com/package/proxy-addr)
   */
  public protocol (): string {
    const protocol = this.parsedUrl.protocol!

    if (!this._config.trustProxy(this.request.connection.remoteAddress!, 0)) {
      return protocol
    }

    const forwardedProtocol = this.header('X-Forwarded-Proto')
    return forwardedProtocol ? forwardedProtocol.split(/\s*,\s*/)[0] : 'http'
  }

  /**
   * Returns a boolean telling if request is served over `https`
   * or not. Check [[protocol]] method to know how protocol is
   * fetched.
   */
  public secure (): boolean {
    return this.protocol() === 'https'
  }

  /**
   * Returns the request hostname. If proxy headers are trusted, then
   * `X-Forwarded-Host` is given priority over the `Host` header.
   *
   * You can control the behavior of trusting the proxy values by defining it
   * inside the `config/app.js` file.
   *
   * ```js
   * {
   *   http: {
   *    trustProxy: '127.0.0.1'
   *   }
   * }
   * ```
   *
   * The value of trustProxy is passed directly to [proxy-addr](https://www.npmjs.com/package/proxy-addr)
   */
  public hostname (): string | null {
    let host = this.header('host')

    /**
     * Use X-Fowarded-Host when we trust the proxy header and it
     * exists
     */
    if (this._config.trustProxy(this.request.connection.remoteAddress!, 0)) {
      host = this.header('X-Forwarded-Host') || host
    }

    if (!host) {
      return null
    }

    /**
     * Support for IPv6
     */
    const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0
    const index = host.indexOf(':', offset)
    return index !== -1 ? host.substring(0, index) : host
  }

  /**
   * Returns an array of subdomains for the given host. An empty array is
   * returned if [[hostname]] is `null` or is an IP address.
   *
   * Also `www` is not considered as a subdomain
   */
  public subdomains (): string[] {
    const hostname = this.hostname()

    /**
     * Return empty array when hostname is missing or it's
     * an IP address
     */
    if (!hostname || isIP(hostname)) {
      return []
    }

    const offset = this._config.subdomainOffset
    const subdomains = hostname.split('.').reverse().slice(offset)

    /**
     * Remove www from the subdomains list
     */
    if (subdomains[subdomains.length - 1] === 'www') {
      subdomains.splice(subdomains.length - 1, 1)
    }

    return subdomains
  }

  /**
   * Returns a boolean telling, if request `X-Requested-With === 'xmlhttprequest'`
   * or not.
   */
  public ajax (): boolean {
    const xRequestedWith = this.header('X-Requested-With', '')
    return xRequestedWith!.toLowerCase() === 'xmlhttprequest'
  }

  /**
   * Returns a boolean telling, if request has `X-Pjax` header
   * set or not
   */
  public pjax (): boolean {
    return !!this.header('X-Pjax')
  }

  /**
   * Returns the request relative URL.
   *
   * @example
   * ```js
   * request.url()
   *
   * // include query string
   * request.url(true)
   * ```
   */
  public url (includeQueryString?: boolean): string {
    const pathname = this.parsedUrl.pathname!
    return includeQueryString ? `${pathname}?${this.parsedUrl.query}` : pathname
  }

  /**
   * Returns the complete HTTP url by combining
   * [[protocol]]://[[hostname]]/[[url]]
   *
   * @example
   * ```js
   * request.completeUrl()
   *
   * // include query string
   * request.completeUrl(true)
   * ```
   */
  public completeUrl (includeQueryString?: boolean): string {
    const protocol = this.protocol()
    const hostname = this.hostname()
    return `${protocol}://${hostname}${this.url(includeQueryString)}`
  }

  /**
   * Returns the best matching content type of the request by
   * matching against the given types.
   *
   * The content type is picked from the `content-type` header and request
   * must have body.
   *
   * The method response highly depends upon the types array values. Described below:
   *
   * | Type(s) | Return value |
   * |----------|---------------|
   * | ['json'] | json |
   * | ['application/*'] | application/json |
   * | ['vnd+json'] | application/json |
   *
   * @example
   * ```js
   * const bodyType = request.is(['json', 'xml'])
   *
   * if (bodyType === 'json') {
   *  // process JSON
   * }
   *
   * if (bodyType === 'xml') {
   *  // process XML
   * }
   * ```
   */
  public is (types: string[]): string | null {
    return typeIs(this.request, types) || null
  }

  /**
   * Returns the best type using `Accept` header and
   * by matching it against the given types.
   *
   * If nothing is matched, then `null` will be returned
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   *
   * @example
   * ```js
   * switch (request.accepts(['json', 'html'])) {
   *   case 'json':
   *     return response.json(user)
   *   case 'html':
   *     return view.render('user', { user })
   *   default:
   *     // decide yourself
   * }
   * ```
   */
  public accepts (types: string[]): string | null {
    this._initiateAccepts()
    return this._lazyAccepts.type(types) || null
  }

  /**
   * Return the types that the request accepts, in the order of the
   * client's preference (most preferred first).
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   */
  public types (): string[] {
    this._initiateAccepts()
    return this._lazyAccepts.types()
  }

  /**
   * Returns the best language using `Accept-language` header
   * and by matching it against the given languages.
   *
   * If nothing is matched, then `null` will be returned
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   *
   * @example
   * ```js
   * switch (request.language(['fr', 'de'])) {
   *   case 'fr':
   *     return view.render('about', { lang: 'fr' })
   *   case 'de':
   *     return view.render('about', { lang: 'de' })
   *   default:
   *     return view.render('about', { lang: 'en' })
   * }
   * ```
   */
  public language (languages: string[]): string | null {
    this._initiateAccepts()
    return this._lazyAccepts.language(languages) || null
  }

  /**
   * Return the languages that the request accepts, in the order of the
   * client's preference (most preferred first).
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   */
  public languages (): string[] {
    this._initiateAccepts()
    return this._lazyAccepts.languages()
  }

  /**
   * Returns the best charset using `Accept-charset` header
   * and by matching it against the given charsets.
   *
   * If nothing is matched, then `null` will be returned
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   *
   * @example
   * ```js
   * switch (request.charset(['utf-8', 'ISO-8859-1'])) {
   *   case 'utf-8':
   *     // make utf-8 friendly response
   *   case 'ISO-8859-1':
   *     // make ISO-8859-1 friendly response
   * }
   * ```
   */
  public charset (charsets: string[]): string | null {
    this._initiateAccepts()
    return this._lazyAccepts.charset(charsets) || null
  }

  /**
   * Return the charsets that the request accepts, in the order of the
   * client's preference (most preferred first).
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   */
  public charsets (): string[] {
    this._initiateAccepts()
    return this._lazyAccepts.charsets()
  }

  /**
   * Returns the best encoding using `Accept-encoding` header
   * and by matching it against the given encodings.
   *
   * If nothing is matched, then `null` will be returned
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   */
  public encoding (encodings: string[]): string | null {
    this._initiateAccepts()
    return this._lazyAccepts.encoding(encodings) || null
  }

  /**
   * Return the charsets that the request accepts, in the order of the
   * client's preference (most preferred first).
   *
   * Make sure to check [accepts](https://www.npmjs.com/package/accepts) package
   * docs too.
   */
  public encodings (): string[] {
    this._initiateAccepts()
    return this._lazyAccepts.encodings()
  }

  /**
   * Returns a boolean telling if request has body
   */
  public hasBody (): boolean {
    return typeIs.hasBody(this.request)
  }

  /**
   * Returns a boolean telling if the new response etag evaluates same
   * as the request header `if-none-match`. In case of `true`, the
   * server must return `304` response, telling the browser to
   * use the client cache.
   *
   * You won't have to deal with this method directly, since AdonisJs will
   * handle this for you when `http.etag = true` inside `config/app.js` file.
   *
   * However, this is how you can use it manually.
   *
   * @example
   * ```js
   * const responseBody = view.render('some-view')
   *
   * // sets the HTTP etag header for response
   * response.setEtag(responseBody)
   *
   * if (request.fresh()) {
   *   response.sendStatus(304)
   * } else {
   *   response.send(responseBody)
   * }
   * ```
   */
  public fresh (): boolean {
    if (['GET', 'HEAD'].indexOf(this.intended()) === -1) {
      return false
    }

    const status = this.response.statusCode
    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.headers(), this.response.getHeaders())
    }

    return false
  }

  /**
   * Opposite of [[fresh]]
   */
  public stale (): boolean {
    return !this.fresh()
  }
}
