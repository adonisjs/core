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
import { RouteGroup } from './Group'
import { Matchers } from './Contracts'
import { Store } from './Store'

/**
 * Router class exposes unified API to create new routes, group them or
 * create route resources.
 *
 * @example
 * ```js
 * const router = new Router()
 * router.get('/', async function () {
 *   // handle request
 * })
 * ```
 */
export class Router {
  private _routes: (Route | RouteResource | RouteGroup)[] = []
  private _matchers: Matchers = {}
  private _store: Store = new Store()

  /**
   * Commits the route to the store. If route type is a group or resource,
   * their childs will be registered recursively
   */
  private _commitRoute (route: RouteResource | RouteGroup | Route) {
    if (route instanceof Route) {
      this._store.add(route.toJSON())
      return
    }

    if (route instanceof RouteGroup) {
      route.routes.forEach((child) => this._commitRoute(child))
      return
    }

    if (route instanceof RouteResource) {
      route.routes.forEach((child) => this._commitRoute(child))
      return
    }
  }

  /**
   * Add route for a given pattern and methods
   */
  public route (pattern: string, methods: string[], handler: any): Route {
    const route = new Route(pattern, methods, handler, this._matchers)
    this._routes.push(route)

    return route
  }

  /**
   * Define a route that handles all common HTTP methods
   */
  public any (pattern: string, handler: any): Route {
    return this.route(pattern, ['HEAD', 'OPTIONS','GET', 'POST', 'PUT', 'PATCH', 'DELETE'], handler)
  }

  /**
   * Define `GET` route
   */
  public get (pattern: string, handler: any): Route {
    return this.route(pattern, ['GET'], handler)
  }

  /**
   * Define `POST` route
   */
  public post (pattern: string, handler: any): Route {
    return this.route(pattern, ['POST'], handler)
  }

  /**
   * Define `PUT` route
   */
  public put (pattern: string, handler: any): Route {
    return this.route(pattern, ['PUT'], handler)
  }

  /**
   * Define `PATCH` route
   */
  public patch (pattern: string, handler: any): Route {
    return this.route(pattern, ['PATCH'], handler)
  }

  /**
   * Define `DELETE` route
   */
  public destroy (pattern: string, handler: any): Route {
    return this.route(pattern, ['DELETE'], handler)
  }

  /**
   * Commit routes to the store. After this, no more
   * routes can be registered.
   */
  public commit () {
    this._routes.forEach((route) => {
      this._commitRoute(route)
    })
  }
}
