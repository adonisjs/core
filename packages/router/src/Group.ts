/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Route } from './Route'
import { RouteResource } from './Resource'
import { BriskRoute } from './BriskRoute'
import { RouteGroupContract } from './Contracts'

/**
 * Group class exposes the API to take action on a group
 * of routes. The group routes must be pre-defined using
 * the constructor.
 */
export class RouteGroup implements RouteGroupContract {
  constructor (public routes: (Route | RouteResource | BriskRoute)[]) {
  }

  /**
   * Invokes a given method with params on the route instance or route
   * resource instance
   */
  private _invoke (route: Route | RouteResource | BriskRoute, method: string, params: any[]) {
    if (route instanceof RouteResource) {
      route.routes.forEach((child) => {
        this._invoke(child, method, params)
      })
      return
    }

    if (route instanceof BriskRoute) {
      /* istanbul ignore else */
      if (route.route) {
        route.route[method](...params)
      }
      return
    }

    route[method](...params)
  }

  /**
   * Define Regex matchers for a given param for all the routes
   */
  public where (param: string, matcher: RegExp | string): this {
    this.routes.forEach((route) => {
      this._invoke(route, 'where', [param, matcher])
    })

    return this
  }

  /**
   * Define prefix all the routes in the group
   */
  public prefix (prefix: string): this {
    this.routes.forEach((route) => {
      this._invoke(route, 'prefix', [prefix])
    })

    return this
  }

  /**
   * Define domain for all the routes
   */
  public domain (domain: string): this {
    this.routes.forEach((route) => {
      this._invoke(route, 'domain', [domain])
    })

    return this
  }

  /**
   * Prepend name to the routes name
   */
  public as (name: string): this {
    this.routes.forEach((route) => {
      this._invoke(route, 'as', [name, true])
    })

    return this
  }

  /**
   * Prepend an array of middleware to all routes middleware
   */
  public middleware (middleware: any | any[]): this {
    this.routes.forEach((route) => {
      this._invoke(route, 'middleware', [middleware, true])
    })

    return this
  }
}
