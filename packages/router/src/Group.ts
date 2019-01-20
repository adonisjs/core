/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Route } from './Route'

/**
 * Group class exposes the API to take action on a group
 * of routes. The group routes must be pre-defined using
 * the constructor.
 */
export class RouteGroup {
  constructor (public routes: Route[]) {
  }

  /**
   * Define Regex matchers for a given param for all the routes
   */
  public where (param: string, matcher: RegExp | string): this {
    this.routes.forEach((route) => {
      route.where(param, matcher)
    })

    return this
  }

  /**
   * Define prefix all the routes in the group
   */
  public prefix (prefix: string): this {
    this.routes.forEach((route) => {
      route.prefix(prefix)
    })

    return this
  }

  /**
   * Define domain for all the routes
   */
  public domain (domain: string): this {
    this.routes.forEach((route) => {
      route.domain(domain)
    })

    return this
  }

  /**
   * Prepend an array of middleware to all routes middleware
   */
  public middleware (middleware: any | any[]): this {
    this.routes.forEach((route) => {
      route.prependMiddleware(middleware)
    })

    return this
  }
}
