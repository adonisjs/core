/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BriskRouteContract, Matchers } from './Contracts'
import { Route } from './Route'
import { Exception } from '@adonisjs/utils'

/**
 * Brisk route enables you to expose expressive API for
 * defining route handler.
 *
 * For example: AdonisJs uses [[BriskRoute]] `Route.on().render()`
 * to render a view without defining a controller method or
 * closure.
 */
export class BriskRoute implements BriskRouteContract {
  private _methods = ['GET']
  public route: null | Route = null
  private _invokedBy: string = ''

  constructor (private _pattern: string, private _globalMatchers: Matchers) {
  }

  /**
   * Set handler for the brisk route. The `invokedBy` string is the reference
   * to the method that calls this method. It is required to create human
   * readable error message when `setHandler` is called for multiple
   * times.
   */
  public setHandler (handler: any, invokedBy: string): Route {
    if (this.route) {
      throw new Exception(
        `\`Route.${invokedBy}\` and \`${this._invokedBy}\` cannot be called together`,
        500,
        'E_MULTIPLE_BRISK_HANDLERS',
      )
    }

    this.route = new Route(this._pattern, this._methods, handler, this._globalMatchers)
    this._invokedBy = invokedBy
    return this.route
  }
}
