/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { singular } from 'pluralize'
import { Matchers, RouteResourceContract } from './Contracts'
import { Route } from './Route'

/**
 * Resource route helps in defining multiple conventional routes. The support
 * for shallow routes makes it super easy to avoid deeply nested routes.
 * Learn more http://weblog.jamisbuck.org/2007/2/5/nesting-resources.
 *
 * @example
 * ```js
 * const resource = new RouteResource('articles', 'ArticlesController')
 * ```
 */
export class RouteResource implements RouteResourceContract {
  public routes: Route[] = []

  constructor (
    private _resource: string,
    private _controller: string,
    private _globalMatchers: Matchers,
    private _shallow = false,
  ) {
    this._buildRoutes()
  }

  /**
   * Add a new route for the given pattern, methods and controller action
   */
  private _makeRoute (pattern, methods, action, baseName) {
    const route = new Route(pattern, methods, `${this._controller}.${action}`, this._globalMatchers)
    route.as(`${baseName}.${action}`)
    this.routes.push(route)
  }

  /**
   * Build routes for the given resource
   */
  private _buildRoutes () {
    const resourceTokens = this._resource.split('.')
    const mainResource = resourceTokens.pop()

    const baseUrl = `${resourceTokens
      .map((token) => `${token}/:${singular(token)}_id`)
      .join('/')}/${mainResource}`

    const memberBaseUrl = this._shallow ? mainResource : baseUrl
    const baseName = this._shallow ? mainResource : this._resource

    this._makeRoute(baseUrl, ['GET'], 'index', this._resource)
    this._makeRoute(`${baseUrl}/create`, ['GET'], 'create', this._resource)
    this._makeRoute(baseUrl, ['POST'], 'store', this._resource)
    this._makeRoute(`${memberBaseUrl}/:id`, ['GET'], 'show', baseName)
    this._makeRoute(`${memberBaseUrl}/:id/edit`, ['GET'], 'edit', baseName)
    this._makeRoute(`${memberBaseUrl}/:id`, ['PUT', 'PATCH'], 'update', baseName)
    this._makeRoute(`${memberBaseUrl}/:id`, ['DELETE'], 'destroy', baseName)
  }

  /**
   * Filter the routes based on their partial names
   */
  private _filter (names, inverse) {
    return this.routes.filter((route) => {
      const match = names.find((name) => route.name.endsWith(name))
      return inverse ? !match : match
    })
  }

  /**
   * Register only given routes and remove others
   */
  public only (names: string[]): this {
    this
      ._filter(names, true)
      .forEach((route) => (route.deleted = true))

    return this
  }

  /**
   * Register all routes, except the one's defined
   */
  public except (names: string[]): this {
    this
      ._filter(names, false)
      .forEach((route) => (route.deleted = true))

    return this
  }

  /**
   * Register api only routes. The `create` and `edit` routes, which
   * are meant to show forms will not be registered
   */
  public apiOnly (): this {
    return this.except(['.create', '.edit'])
  }

  /**
   * Add middleware to routes inside the resource
   */
  public middleware (middleware: { [name: string]: any | any[] }): this {
    for (let name in middleware) {
      const route = this.routes.find((route) => route.name.endsWith(name))
      /* istanbul ignore else */
      if (route) {
        route.middleware(middleware[name])
      }
    }

    return this
  }

  /**
   * Define matcher for params inside the resource
   */
  public where (key: string, matcher: string | RegExp): this {
    this.routes.forEach((route) => {
      route.where(key, matcher)
    })

    return this
  }
}
