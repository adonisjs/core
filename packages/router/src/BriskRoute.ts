/**
 * @module Http.Router
 */

/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'
import { BriskRouteContract, Matchers } from './Contracts'
import { Route } from './Route'
import { Exception } from '@adonisjs/utils'
import { exceptionCodes } from '../lib'

/**
 * Brisk route enables you to expose expressive API for
 * defining route handler.
 *
 * For example: AdonisJs uses [[BriskRoute]] `Route.on().render()`
 * to render a view without defining a controller method or
 * closure.
 */
export class BriskRoute extends Macroable implements BriskRouteContract {
  protected static _macros = {}
  protected static _getters = {}

  /**
   * Invoked by is reference to the parent method that calls `setHandler` on
   * this class. We keep a reference to the parent method name for raising
   * meaningful exception
   */
  private _invokedBy: string = ''

  /**
   * Reference to route instance. Set after `setHandler` is called
   */
  public route: null | Route = null

  constructor (private _pattern: string, private _namespace: string, private _globalMatchers: Matchers) {
    super()
  }

  /**
   * Set handler for the brisk route. The `invokedBy` string is the reference
   * to the method that calls this method. It is required to create human
   * readable error message when `setHandler` is called for multiple
   * times.
   */
  public setHandler (handler: any, invokedBy: string, methods?: string[]): Route {
    if (this.route) {
      throw new Exception(
        `\`Route.${invokedBy}\` and \`${this._invokedBy}\` cannot be called together`,
        500,
        exceptionCodes.E_MULTIPLE_BRISK_HANDLERS,
      )
    }

    this.route = new Route(this._pattern, methods || ['GET'], handler, this._namespace, this._globalMatchers)
    this._invokedBy = invokedBy

    return this.route
  }
}
