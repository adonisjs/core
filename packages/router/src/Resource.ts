/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { singular } from 'pluralize'
import { Matchers } from './Contracts'
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
export class RouteResource {
  constructor (
    private _resource: string,
    private _controller: string,
    private _globalMatchers: Matchers,
    private _shallow = false,
  ) {}

  public get routes (): Route[] {
    return this._buildRoutes()
  }

  /**
   * Add a new route for the given pattern, methods and controller action
   */
  private _makeRoute (pattern, methods, action) {
    return new Route(pattern, methods, `${this._controller}.${action}`, this._globalMatchers)
  }

  /**
   * Builds route for the resource. We build the routes everytime a call
   * to `routes` getter is made, this helps in build the correct set
   * of routes after applying all the filters.
   *
   * In normal use-cases the call to `routes` getter will be only done once, when
   * the router attempts to register the routes with the store.
   */
  private _buildRoutes (): Route[] {
    const resourceTokens = this._resource.split('.')
    const mainResource = resourceTokens.pop()

    const baseUrl = `${resourceTokens
      .map((token) => `${token}/:${singular(token)}_id`)
      .join('/')}/${mainResource}`

    const memberBaseUrl = this._shallow ? mainResource : baseUrl

     return [
       this._makeRoute(baseUrl, ['GET'], 'index'),
       this._makeRoute(`${baseUrl}/create`, ['GET'], 'create'),
       this._makeRoute(baseUrl, ['POST'], 'store'),
       this._makeRoute(`${memberBaseUrl}/:id`, ['GET'], 'show'),
       this._makeRoute(`${memberBaseUrl}/:id/edit`, ['GET'], 'edit'),
       this._makeRoute(`${memberBaseUrl}/:id`, ['PUT', 'PATCH'], 'update'),
       this._makeRoute(`${memberBaseUrl}/:id`, ['DELETE'], 'destroy'),
    ]
  }
}
