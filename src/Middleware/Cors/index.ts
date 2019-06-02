/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { ResponseContract } from '@ioc:Adonis/Core/Response'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { CorsConfig } from '@ioc:Adonis/Core/Cors'

/**
 * List of default exposed headers.
 */
const SIMPLE_EXPOSE_HEADERS = [
  'cache-control',
  'content-language',
  'content-type',
  'expires',
  'last-modified',
  'pragma',
]

/**
 * The Cors middleware class to handle preflight request as per the CORS
 * RFC https://www.w3.org/TR/cors/.
 *
 * This is a functional middleware and shared among all requests. So make
 * sure not to set request specific instance properties.
 */
export class Cors {
  constructor (private _options: CorsConfig) {
    this._normalizeOptions()
  }

  /**
   * Normalize config options
   */
  private _normalizeOptions () {
    /**
     * Convert all headers to lowercase
     */
    this._options.exposeHeaders = this._options.exposeHeaders.map((header) => header.toLowerCase())

    const hasExtraHeaders = this._options.exposeHeaders.find((header) => {
      return SIMPLE_EXPOSE_HEADERS.indexOf(header) === -1
    })

    /**
     * If expose headers doesn't have extra headers, then empty the list
     */
    if (!hasExtraHeaders) {
      this._options.exposeHeaders = []
    }
  }

  /**
   * Computes the origin for the current request based upon the
   * user config.
   *
   * Origin match is always case sensitive
   */
  private _computeResponseOrigin (origin: string): string | null {
    let allowedOrigins = this._options.origin

    /**
     * If the `origin` value inside user config is a function, we
     * call that function and use the return value as the
     * new config value.
     */
    if (typeof (allowedOrigins) === 'function') {
      allowedOrigins = allowedOrigins(origin)
    }

    /**
     * If true, then allow the current origin
     */
    if (allowedOrigins === true) {
      return origin
    }

    /**
     * False, disallows all origins
     */
    if (allowedOrigins === false) {
      return null
    }

    /**
     * Wildcard allows the current origin. However, it also indicates
     * the browser that all origins are allowed.
     *
     * Fundamentaly `*` and `true` are not same, though they both allows
     * the same origin.
     */
    if (allowedOrigins === '*') {
      /**
       * Setting `Access-Control-Allow-Origin=*` along with `Access-Control-Allow-Credentials=true`
       * isn't allowed. So in that case, we return the value of the current origin and not the
       * wildcard identifier.
       */
      return this._options.credentials === true ? origin : '*'
    }

    /**
     * Find the matching origin, if value is an array
     */
    if (Array.isArray(allowedOrigins)) {
      if (allowedOrigins.find((allowedOrigin) => allowedOrigin === origin)) {
        return origin
      }
      return null
    }

    /**
     * Find the matching origin, if value is a comma seperated string
     */
    if (allowedOrigins.split(',').find((allowedOrigin) => allowedOrigin === origin)) {
      return origin
    }

    /**
     * Nothing is allowed
     */
    return null
  }

  /**
   * Returns an array of headers allowed based upon user config
   * and request headers.
   *
   * The array items are casted to lowercase for case insensitive
   * match.
  */
  private _computedAllowedHeaders (headers: string[]): string[] {
    let allowedHeaders = this._options.headers

    /**
     * Compute allowed headers by calling the config function.
     */
    if (typeof (allowedHeaders) === 'function') {
      allowedHeaders = allowedHeaders(headers)
    }

    /**
     * Allow current set of headers, when `allowedHeaders = true`
     */
    if (allowedHeaders === true) {
      return headers.map((header) => header.toLowerCase())
    }

    /**
     * Disallow all headers
     */
    if (allowedHeaders === false) {
      return []
    }

    /**
     * Allow explicitly define headers as an array of comma seperated
     * string literal.
     */
    if (Array.isArray(allowedHeaders)) {
      return allowedHeaders.map((header) => header.toLowerCase())
    }

    return allowedHeaders.split(',').map((header) => header.toLowerCase())
  }

  /**
   * Sets the `Access-Control-Allow-Origin` header
   */
  private _setOrigin (response: ResponseContract, allowedOrigin: string) {
    response.header('Access-Control-Allow-Origin', allowedOrigin)
  }

  /**
   * Setting `Access-Control-Expose-Headers` headers, when custom headers
   * are defined. If no custom headers are defined, then simple response
   * headers are used instead.
   */
  private _setExposedHeaders (response: ResponseContract) {
    if (this._options.exposeHeaders.length) {
      response.header('Access-Control-Expose-Headers', this._options.exposeHeaders.join(','))
    }
  }

  /**
   * Allows `Access-Control-Allow-Credentials` when enabled inside the user
   * config.
   */
  private _setCredentials (response: ResponseContract) {
    if (this._options.credentials === true) {
      response.header('Access-Control-Allow-Credentials', 'true')
    }
  }

  /**
   * Set `Access-Control-Allow-Methods` header.
   */
  private _setAllowMethods (response: ResponseContract) {
    response.header('Access-Control-Allow-Methods', this._options.methods.join(','))
  }

  /**
   * Set `Access-Control-Allow-Headers` header.
   */
  private _setAllowHeaders (response: ResponseContract, allowedHeaders: string[]) {
    response.header('Access-Control-Allow-Headers', allowedHeaders.join(','))
  }

  /**
   * Set `Access-Control-Max-Age` header.
   */
  private _setMaxAge (response: ResponseContract) {
    if (this._options.maxAge) {
      response.header('Access-Control-Max-Age', this._options.maxAge)
    }
  }

  /**
   * Ends the preflight request with 204 status code
   */
  private _endPreFlight (response: ResponseContract) {
    response.status(204).send(null)
  }

  /**
   * Handle HTTP request for CORS.
   */
  public async handle ({ request, response }: HttpContextContract, next: () => Promise<void>) {
    const origin = request.header('origin')
    const isOptions = request.method() === 'OPTIONS'

    /**
     * If their is no Origin header present, then let the user-agent handle
     * this situation, since the request is outside the scope of CORS.
     */
    if (!origin) {
      await next()
      return
    }

    const allowedOrigin = this._computeResponseOrigin(origin)

    /**
     * If current origin is not allowed, then do not set any headers
     * and end the OPTIONS request.
     *
     * For non OPTIONS request, we advance the middleware chain.
     */
    if (!allowedOrigin) {
      if (isOptions) {
        this._endPreFlight(response)
      } else {
        await next()
      }

      return
    }

    /**
     * Non options requests
     */
    if (request.method() !== 'OPTIONS') {
      this._setOrigin(response, allowedOrigin)
      this._setCredentials(response)
      this._setExposedHeaders(response)
      await next()
      return
    }

    const requestMethod = request.header('Access-Control-Request-Method')

    /**
     * End the request, when `Access-Control-Request-Method` is missing or isn't
     * part of allowed methods.
     * https://www.w3.org/TR/cors/#http-access-control-request-method
     */
    if (!requestMethod || this._options.methods.indexOf(requestMethod) === -1) {
      this._endPreFlight(response)
      return
    }

    /**
     * When `Access-Control-Request-Headers` header is missing or is empty, then
     * we subsitute that with an empty list.
     * https://www.w3.org/TR/cors/#http-access-control-request-headers
     */
    let requestHeaders: unknown = request.header('Access-Control-Request-Headers')
    if (requestHeaders && requestHeaders !== '') {
      requestHeaders = (requestHeaders as string).split(',')
    } else {
      requestHeaders = []
    }

    /**
     * Computing allowed headers array from the user config
     */
    const allowedHeaders = this._computedAllowedHeaders(requestHeaders as string[])

    /**
     * Finding if all request `Access-Control-Request-Headers` falls under the
     * list of allowed headers inside user config
     */
    const headersMatches = (requestHeaders as string[]).every((header) => {
      if (header === 'origin') {
        return true
      }

      /**
       * Doing case insenstive match
       */
      return allowedHeaders.indexOf(header.toLowerCase()) > -1
    })

    /**
     * If headers test fails, then we need to end the request without setting
     * any headers (part of spec).
     * https://www.w3.org/TR/cors/#http-access-control-request-headers
     */
    if (headersMatches === false) {
      this._endPreFlight(response)
      return
    }

    this._setOrigin(response, allowedOrigin)
    this._setCredentials(response)
    this._setExposedHeaders(response)
    this._setAllowMethods(response)
    this._setAllowHeaders(response, allowedHeaders)
    this._setMaxAge(response)
    this._endPreFlight(response)
  }
}
