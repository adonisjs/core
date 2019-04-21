/**
* @module Http.Response
*/

/*
* @adonisjs/framework
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { ServerResponse, IncomingMessage } from 'http'
import { parse } from 'url'
import * as etag from 'etag'
import * as onFinished from 'on-finished'
import * as destroy from 'destroy'
import { createReadStream, stat, Stats } from 'fs'
import { extname } from 'path'
import * as mime from 'mime-types'
import * as contentDisposition from 'content-disposition'
import * as vary from 'vary'
import * as fresh from 'fresh'
import { Macroable } from 'macroable'
import { serialize, CookieOptions } from '@adonisjs/cookie'

import {
  ResponseContract,
  CastableHeader,
  LazyBody,
  ResponseContentType,
  ResponseStream,
  ResponseConfig,
} from './ResponseContract'

/**
 * Wraps `fs.stat` to promise interface.
 */
function statFn (filePath): Promise<Stats> {
  return new Promise((resolve, reject) => {
    stat(filePath, (error, stats) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stats)
    })
  })
}

/**
 * The response is a wrapper over [ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)
 * streamlining the process of writing response body and automatically setting up appropriate headers.
 *
 * The response class has support for `explicitEnd` mode, which is set to true by default.
 *
 * When implicit end is set to true, the response class will not write content to the HTTP response
 * directly and instead waits for an explicit call to the `finish` method. This is done to
 * allow `return` statements from controllers.
 *
 * This is how `explicitEnd` mode works in nutshell.
 *
 * **When set to true**
 * 1. Calls to `send`, `json` and `jsonp` will be buffered until `finish` is called.
 * 2. `response.hasLazyBody` returns `true` after calling `send`, `json` or `jsonp`.
 * 3. If `response.hasLazyBody` return `false`, then server will use the `return value` of the controller
 *    and set it as body before calling `finish`.
 *
 * **When set to false**
 * 1. Calls to `send`, `json` and `jsonp` will write the response writeaway.
 * 2. The `return value` of the controller will be discarded.
 * 3. The call to `finish` method is a noop.
 */
export class Response extends Macroable implements ResponseContract {
  public explicitEnd = false

  /**
   * Lazy body is used to set the response body. However, do not
   * write it on the socket immediately unless `response.finish`
   * is called.
   *
   * Only works with `explicitEnd=true`, which is set to `false` by default
   */
  public lazyBody: LazyBody | null = null

  protected static _macros = {}
  protected static _getters = {}

  private _headers: any = {}

  constructor (
    public request: IncomingMessage,
    public response: ServerResponse,
    private _config: ResponseConfig,
    private _secretKey?: string,
  ) {
    super()
  }

  /**
   * Returns a boolean telling if lazy body is already set or not
   */
  get hasLazyBody (): boolean {
    return !!(this.lazyBody && this.lazyBody.writer)
  }

  /**
   * Returns a boolean telling if response is finished or not.
   * Any more attempts to update headers or body will result
   * in raised exceptions.
   */
  get finished (): boolean {
    return this.response.finished
  }

  /**
   * Returns a boolean telling if response headers has been sent or not.
   * Any more attempts to update headers will result in raised
   * exceptions.
   */
  get headersSent (): boolean {
    return this.response.headersSent
  }

  /**
   * Returns a boolean telling if response headers and body is written
   * or not. When value is `true`, you can feel free to write headers
   * and body.
   */
  get isPending (): boolean {
    return (!this.headersSent && !this.finished)
  }

  /**
   * Normalizes header value to a string or an array of string
   */
  private _castHeaderValue (value: any): string | string[] {
    return Array.isArray(value) ? (value as any).map(String) : String(value)
  }

  /**
   * Writes the body with appropriate response headers. Etag header is set
   * when `generateEtag` is set to `true`.
   *
   * Empty body results in `204`.
   */
  private _writeBody (content: any, generateEtag: boolean, jsonpCallbackName?: string): void {
    let { type, body, originalType } = this.buildResponseBody(content)

    /**
     * Send 204 and remove content headers when body
     * is null
     */
    if (body === null) {
      this.status(204)
      this.removeHeader('Content-Type')
      this.removeHeader('Content-Length')
      this.removeHeader('Transfer-Encoding')
      this._end()
      return
    }

    /**
     * Unknown types are not serializable
     */
    if (type === 'unknown') {
      throw new Error(`Cannot send ${originalType} as HTTP response`)
    }

    /**
     * In case of 204 and 304, remove unwanted headers
     */
    if ([204, 304].indexOf(this.response.statusCode) > -1) {
      this.removeHeader('Content-Type')
      this.removeHeader('Content-Length')
      this.removeHeader('Transfer-Encoding')
      this._end(body)
      return
    }

    /**
     * Decide correct content-type header based upon the existence of
     * JSONP callback.
     */
    if (jsonpCallbackName) {
      this.header('X-Content-Type-Options', 'nosniff')
      this.safeHeader('Content-Type', 'text/javascript; charset=utf-8')
    } else {
      this.safeHeader('Content-Type', `${type}; charset=utf-8`)
    }

    /**
     * Generate etag if instructed. This is send using the request
     * body, which adds little delay to the response but ensures
     * unique etag based on body
     */
    if (generateEtag) {
      this.setEtag(body)
    }

    /**
     * If JSONP callback exists, then update the body to be a
     * valid JSONP response
     */
    if (jsonpCallbackName) {
      /**
       * replace chars not allowed in JavaScript that are in JSON
       * https://github.com/rack/rack-contrib/pull/37
       */
      body = body.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

      // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
      // https://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2014-4671
      // http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/
      // http://drops.wooyun.org/tips/2554
      body = `/**/ typeof ${jsonpCallbackName} === 'function' && ${jsonpCallbackName}(${body});`
    }

    /**
     * Compute content length
     */
    this.header('Content-Length', Buffer.byteLength(body))
    this._end(body)
  }

  private _end (body?: any, statusCode?: number) {
    this.flushHeaders(statusCode)

    // avoid ArgumentsAdaptorTrampoline from V8 (inspired by fastify)
    const res = this.response as any
    res.end(body, null, null)
  }

  public flushHeaders (statusCode?: number): this {
    this.response.writeHead(statusCode || this.response.statusCode, this._headers)
    this._headers = {}

    return this
  }

  /**
   * Returns the existing value for a given HTTP response
   * header.
   */
  public getHeader (key: string) {
    const value = this._headers[key.toLowerCase()]
    return value === undefined ? this.response.getHeader(key) : value
  }

  /**
   * Set header on the response. To `append` values to the existing header, we suggest
   * using [[append]] method.
   *
   * If `value` is non existy, then header won't be set.
   *
   * @example
   * ```js
   * response.header('content-type', 'application/json')
   * ```
   */
  public header (key: string, value: CastableHeader): this {
    if (value) {
      this._headers[key.toLowerCase()] = this._castHeaderValue(value)
    }
    return this
  }

  /**
   * Append value to an existing header. To replace the value, we suggest using
   * [[header]] method.
   *
   * If `value` is not existy, then header won't be set.
   *
   * @example
   * ```js
   * response.append('set-cookie', 'username=virk')
   * ```
   */
  public append (key: string, value: CastableHeader): this {
    /* istanbul ignore if */
    if (!value) {
      return this
    }

    key = key.toLowerCase()

    let existingHeader = this.getHeader(key)
    let casted = this._castHeaderValue(value)

    /**
     * If there isn't any header, then setHeader right
     * away
     */
    if (!existingHeader) {
      this._headers[key] = casted
      return this
    }

    existingHeader = this._castHeaderValue(existingHeader)
    casted = Array.isArray(existingHeader) ? existingHeader.concat(casted) : [existingHeader].concat(casted)

    this._headers[key] = casted
    return this
  }

  /**
   * Adds HTTP response header, when it doesn't exists already.
   */
  public safeHeader (key: string, value: CastableHeader): this {
    if (!this.getHeader(key)) {
      this.header(key, value)
    }
    return this
  }

  /**
   * Removes the existing response header from being sent.
   */
  public removeHeader (key: string): this {
    delete this._headers[key.toLowerCase()]
    return this
  }

  /**
   * Set HTTP status code
   */
  public status (code: number): this {
    this.response.statusCode = code
    return this
  }

  /**
   * Set response type by looking up for the mime-type using
   * partial types like file extensions.
   *
   * Make sure to read [mime-types](https://www.npmjs.com/package/mime-types) docs
   * too.
   *
   * @example
   * ```js
   * response.type('.json') // Content-type: application/json
   * ```
   */
  public type (type: string, charset?: string): this {
    type = charset ? `${type}; charset=${charset}` : type
    this.header('Content-Type', mime.contentType(type))

    return this
  }

  /**
   * Set the Vary HTTP header
   */
  public vary (field: string): this {
    vary(this.response, field)
    return this
  }

  /**
   * Set etag by computing hash from the body. This class will set the etag automatically
   * when `etag = true` in the defined config object.
   *
   * Use this function, when you want to compute etag manually for some other resons.
   */
  public setEtag (body: any, weak: boolean = false) : this {
    this.header('Etag', etag(body, { weak }))
    return this
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
   * if (response.fresh()) {
   *   response.sendStatus(304)
   * } else {
   *   response.send(responseBody)
   * }
   * ```
   */
  public fresh (): boolean {
    if (this.request.method && ['GET', 'HEAD'].indexOf(this.request.method) === -1) {
      return false
    }

    const status = this.response.statusCode
    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.request.headers, this._headers)
    }

    return false
  }

  /**
   * Builds the response body and returns it's appropriate type
   * to be set as the content-type header.
   *
   * Ideally, you should use [[send]] vs using this method. This method will
   * not set any headers and must be used when you want more control over the
   * response sending process.
   *
   * Make sure to appropriately handle the case of `unknown` type, which is returned
   * when unable to parse the body type.
   */
  public buildResponseBody (body: any): { body: any, type: ResponseContentType, originalType?: string } {
    if (!body) {
      return {
        body: null,
        type: 'null',
      }
    }

    if (typeof (body) === 'string') {
      return {
        body,
        type: /^\s*</.test(body) ? 'text/html' : 'text/plain',
      }
    }

    if (Buffer.isBuffer(body)) {
      return {
        body,
        type: 'application/octet-stream',
      }
    }

    if (typeof (body) === 'number' || typeof (body) === 'boolean') {
      return {
        body: String(body),
        type: 'text/plain',
      }
    }

    if (typeof (body) === 'object') {
      return {
        body: JSON.stringify(body),
        type: 'application/json',
      }
    }

    return {
      body,
      originalType: typeof (body),
      type: 'unknown',
    }
  }

  /**
   * Send the body as response and optionally generate etag. The default value
   * is read from `config/app.js` file, using `http.etag` property.
   *
   * This method buffers the body if `explicitEnd = true`, which is the default
   * behavior and do not change, unless you know what you are doing.
   */
  public send (body: any, generateEtag: boolean = this._config.etag): void {
    if (this.explicitEnd) {
      this.lazyBody = {
        writer: this._writeBody,
        args: [body, generateEtag],
      }
      return
    }

    this._writeBody(body, generateEtag)
  }

  /**
   * Alias of [[send]]
   */
  public json (body: any, generateEtag?: boolean): void {
    return this.send(body, generateEtag)
  }

  /**
   * Writes response as JSONP. The callback name is resolved as follows, with priority
   * from top to bottom.
   *
   * 1. Explicitly defined as 2nd Param.
   * 2. Fetch from request query string.
   * 3. Use the config value `http.jsonpCallbackName` from `config/app.js`.
   * 4. Fallback to `callback`.
   *
   * This method buffers the body if `explicitEnd = true`, which is the default
   * behavior and do not change, unless you know what you are doing.
   */
  public jsonp (
    body: any,
    callbackName: string = this._config.jsonpCallbackName,
    generateEtag: boolean = this._config.etag,
  ) {
    if (this.explicitEnd) {
      this.lazyBody = {
        writer: this._writeBody,
        args: [body, generateEtag, callbackName],
      }
      return
    }

    this._writeBody(body, generateEtag, callbackName)
  }

  /**
   * Pipe stream to the response. This method will gracefully destroy
   * the stream, avoiding memory leaks.
   *
   * If `raiseErrors=false`, then this method will self handle all the exceptions by
   * writing a generic HTTP response. To have more control over the error, it is
   * recommended to set `raiseErrors=true` and wrap this function inside a
   * `try/catch` statement.
   *
   * Streaming a file from the disk and showing 404 when file is missing.
   *
   * @example
   * ```js
   * // Errors handled automatically with generic HTTP response
   * response.stream(fs.createReadStream('file.txt'))
   *
   * // Manually handle (note the await call)
   * try {
   *   await response.stream(fs.createReadStream('file.txt'))
   * } catch () {
   *   response.status(404).send('File not found')
   * }
   * ```
   */
  public stream (body: ResponseStream, raiseErrors: boolean = false): Promise<Error | void> {
    if (typeof (body.pipe) !== 'function' || !body.readable || typeof (body.read) !== 'function') {
      throw new Error('response.stream accepts a readable stream only')
    }

    return new Promise((resolve, reject) => {
      /**
       * It is important to set `explicitEnd=false` to avoid
       * buffered response during streaming
       */
      this.explicitEnd = false

      let finished = false

      /**
       * Listen for errors on the stream and properly destroy
       * stream
       */
      body.on('error', (error) => {
        /* istanbul ignore if */
        if (finished) {
          return
        }

        finished = true
        destroy(body)

        if (raiseErrors) {
          reject(error)
        } else {
          this._end(
            error.code === 'ENOENT' ? 'File not found' : 'Cannot process file',
            error.status || 500,
          )
          resolve()
        }
      })

      /**
       * Listen for end and resolve the promise
       */
      body.on('end', resolve)

      /**
       * Cleanup stream when finishing response
       */
      onFinished(this.response, () => {
        finished = true
        destroy(body)
      })

      /**
       * Pipe stream
       */
      this.flushHeaders()
      body.pipe(this.response)
    })
  }

  /**
   * Download file by streaming it from the file path. This method will setup
   * appropriate `Content-type`, `Content-type` and `Last-modified` headers.
   *
   * Unexpected stream errors are handled gracefully to avoid memory leaks.
   *
   * If `raiseErrors=false`, then this method will self handle all the exceptions by
   * writing a generic HTTP response. To have more control over the error, it is
   * recommended to set `raiseErrors=true` and wrap this function inside a
   * `try/catch` statement.
   *
   * @example
   * ```js
   * // Errors handled automatically with generic HTTP response
   * response.download('somefile.jpg')
   *
   * // Manually handle (note the await call)
   * try {
   *   await response.download('somefile.jpg')
   * } catch (error) {
   *   response.status(error.code === 'ENOENT' ? 404 : 500)
   *   response.send('Cannot process file')
   * }
   * ```
   */
  public async download (
    filePath: string,
    generateEtag: boolean = this._config.etag,
    raiseErrors: boolean = false,
  ) {
    this.explicitEnd = false

    try {
      const stats = await statFn(filePath)
      if (!stats || !stats.isFile()) {
        throw new Error('response.download only accepts path to a file')
      }

      /**
       * Set appropriate headers
       */
      this.header('Last-Modified', stats.mtime.toUTCString())
      this.header('Content-length', stats.size)
      this.type(extname(filePath))

      /**
       * If etags are disabled, then stream the file right away, otherwise
       * we need to for cache based on etag.
       */
      if (!generateEtag) {
        if (this.request.method === 'HEAD') {
          this._end()
          return
        }

        /**
         * Stream if not HEAD request
         */
        return this.stream(createReadStream(filePath), raiseErrors)
      }

      this.setEtag(stats, true)
      const fresh = this.fresh()

      /**
       * If cache is fresh then always response with 304 for
       * GET and HEAD requests.
       */
      if (fresh) {
        this._end(null, 304)
        return
      }

      /**
       * If request is HEAD and response is not fresh, then respond
       * with a 200 and ask the browser to initiate the GET request.
       */
      if (this.request.method === 'HEAD') {
        this._end(null, 200)
        return
      }

      /**
       * Finally stream the file
       */
      return this.stream(createReadStream(filePath), raiseErrors)
    } catch (error) {
      if (raiseErrors) {
        throw error
      } else {
        this._end('Cannot process file', 404)
      }
    }
  }

  /**
   * Download the file by forcing the user to save the file vs displaying it
   * within the browser.
   *
   * Internally calls [[download]]
   */
  public async attachment (
    filePath: string,
    name?: string,
    disposition?: string,
    generateEtag?: boolean,
    raiseErrors?: boolean,
  ) {
    name = name || filePath
    this.header('Content-Disposition', contentDisposition(name, { type: disposition }))
    return this.download(filePath, generateEtag, raiseErrors)
  }

  /**
   * Set the location header.
   *
   * @example
   * ```js
   * response.location('/login')
   * ```
   */
  public location (url: string): this {
    this.header('Location', url)
    return this
  }

  /**
   * Redirect request to a different URL. Current request `query string` can be forwared
   * by setting 2nd param to `true`.
   */
  public redirect (url: string, sendQueryParams?: boolean, statusCode: number = 302): void {
    url = sendQueryParams ? `${url}?${parse(this.request.url!, false).query}` : url

    this.explicitEnd = false

    this.location(url)
    this._end(`Redirecting to ${url}`, statusCode)
  }

  /**
   * Set signed cookie as the response header. The inline options overrides
   * all options from the config (means they are not merged).
   */
  public cookie (key: string, value: any, options?: Partial<CookieOptions>): this {
    if (options) {
      options = Object.assign({}, this._config.cookie, options)
    } else {
      options = this._config.cookie
    }

    const serialized = serialize(key, value, this._secretKey, options)
    if (!serialized) {
      return this
    }

    this.append('set-cookie', serialized)
    return this
  }

  /**
   * Set unsigned cookie as the response header. The inline options overrides
   * all options from the config (means they are not merged)
   */
  public plainCookie (key: string, value: any, options?: Partial<CookieOptions>): this {
    if (options) {
      options = Object.assign({}, this._config.cookie, options)
    } else {
      options = this._config.cookie
    }

    const serialized = serialize(key, value, undefined, options)
    if (!serialized) {
      return this
    }

    this.append('set-cookie', serialized)
    return this
  }

  /**
   * Clear existing cookie.
   */
  public clearCookie (key: string, options?: Partial<CookieOptions>): this {
    if (options) {
      options = Object.assign({}, this._config.cookie, options)
    } else {
      options = this._config.cookie
    }

    options.expires = new Date(1)

    const serialized = serialize(key, '', undefined, options)
    if (!serialized) {
      return this
    }

    this.append('set-cookie', serialized)
    return this
  }

  /**
   * Finishes the response by writing the lazy body, when `explicitEnd = true`
   * and response is already pending.
   *
   * Calling this method twice or when `explicitEnd = false` is noop.
   */
  public finish () {
    if (this.explicitEnd && this.lazyBody && this.isPending) {
      this.lazyBody.writer.bind(this)(...this.lazyBody.args)
      this.lazyBody = null
    }
  }
}
