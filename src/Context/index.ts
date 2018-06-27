/**
 * @module Http
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
*/

import Macroable from 'macroable'

/**
 * An instance of this class is passed to all route handlers
 * and middleware. Also different part of applications
 * can bind getters to this class.
 *
 * @example
 * ```js
 * const Context = use('Context')
 *
 * Context.getter('view', function () {
 *   return new View()
 * }, true)
 *
 * // The last option `true` means the getter is singleton.
 * ```
 */
class Context extends Macroable {
  /**
   * Node.js HTTP server req object.
   */
  public req: Request

  /**
   * Node.js HTTP server res object.
   */
  public res: Response

  private static _macros: Object = {}

  private static _getters: Object = {}

  private static _readyFns: Function[] = []

  /**
   * Constructor.
   *
   * @param  req
   * @param  res
   */
  constructor (req: Request, res: Response) {
    super()

    this.req = req
    this.res = res

    Context._readyFns
      .filter((fn) => typeof (fn) === 'function')
      .forEach((fn) => fn(this))
  }


  /**
   * Hydrate the context constructor.
   */
  public static hydrate (): void {
    super.hydrate()
    Context._readyFns = []
  }

  /**
   * Define onReady callbacks to be executed
   * once the request context is instantiated
   *
   * @param fn
   */
  public static onReady (fn: Function): typeof Context {
    Context._readyFns.push(fn)
    return Context
  }
}

export { Context }
