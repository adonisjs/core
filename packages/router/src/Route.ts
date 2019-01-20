/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RouteDefination, Matchers } from './Contracts'

/**
 * Route class is used to construct consistent [[RouteDefination]] using
 * fluent API. An instance of route is usually obtained using the
 * [[Router]] class helper methods.
 *
 * @example
 * ```js
 * const route = new Route('posts/:id', ['GET'], async function () {
 * })
 *
 * route
 *   .where('id', /^[0-9]+$/)
 *   .middleware(async function () {
 *   })
 * ```
 */
export class Route {
  /**
   * By default the route is part of `root` domain. Root
   * domain is used when no domain is defined
   */
  private _domain: string = 'root'

  /**
   * A unique name to lookup the route
   */
  private _name: string

  /**
   * An object of matchers to be forwarded to the
   * store. The matchers list is populated by
   * calling `where` method
   */
  private _matchers: Matchers = {}

  /**
   * A custom prefix. Usually added to a group of
   * routes
   */
  private _prefix: string = ''

  /**
   * An array of middleware. Added using `middleware` function
   */
  private _middleware: any[] = []

  constructor (
    private _pattern: string,
    private _methods: string[],
    private _handler: any,
    private _globalMatchers: Matchers,
  ) {}

  /**
   * Returns an object of param matchers by merging global and local
   * matchers. The local copy is given preference over the global
   * one's
   */
  private _getMatchers () {
    return Object.assign({}, this._globalMatchers, this._matchers)
  }

  /**
   * Returns a normalized pattern string by prefixing the `prefix` (if defined).
   */
  private _getPattern () {
    const prefix = `${this._prefix.replace(/\/$/, '')}/`
    return this._pattern === '/' ? prefix : `${prefix}${this._pattern.replace(/^\//, '')}`
  }

  /**
   * Define Regex matcher for a given param
   */
  public where (param: string, matcher: string | RegExp): this {
    this._matchers[param] = matcher
    return this
  }

  /**
   * Define prefix for the route. Calling this method for multiple times will
   * override the existing prefix.
   */
  public prefix (prefix: string): this {
    this._prefix = prefix
    return this
  }

  /**
   * Define a custom domain for the route
   */
  public domain (domain: string): this {
    this._domain = domain
    return this
  }

  /**
   * Define an array of middleware to be executed on the route.
   */
  public middleware (middleware: any | any[]): this {
    middleware = Array.isArray(middleware) ? middleware : [middleware]
    this._middleware = this._middleware.concat(middleware)
    return this
  }

  /**
   * Prepend middleware to the list of route middleware
   */
  public prependMiddleware (middleware: any | any[]): this {
    middleware = Array.isArray(middleware) ? middleware : [middleware]
    this._middleware = middleware.concat(this._middleware)
    return this
  }

  /**
   * Given memorizable name to the route. This is helpful, when you
   * want to lookup route defination by it's name.
   */
  public as (name: string): this {
    this._name = name
    return this
  }

  /**
   * Returns [[RouteDefination]] that can be passed to the [[Store]] for
   * registering the route
   */
  public toJSON (): RouteDefination {
    return {
      domain: this._domain,
      pattern: this._getPattern(),
      matchers: this._getMatchers(),
      handler: this._handler,
      meta: {},
      name: this._name,
      methods: this._methods,
      middleware: this._middleware,
    }
  }
}
