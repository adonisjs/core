/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@adonisjs/utils'
import * as haye from 'haye'

import { MiddlewareStoreContract, MiddlewareNode, ResolvedMiddlewareNode } from './Contracts'

/**
 * Middleware store register and keep all the application middleware at one
 * place. Also middleware are resolved during the registration and any
 * part of the application can read them without extra overhead.
 *
 * The middleware store transparently relies on `Ioc.use` and `Ioc.make`
 * globals. If you are not using the IoC container, then simply register
 * all middleware as plain functions and not `ioc namespaces`.
 *
 * @example
 * ```
 * const store = new MiddlewareStore()
 *
 * store.register([
 *   'App/Middleware/Auth'
 * ])
 *
 * store.registerNamed({
 *   auth: 'App/Middleware/Auth'
 * })
 *
 * store.get()
 * ```
 */
export class MiddlewareStore implements MiddlewareStoreContract {
  private _list: ResolvedMiddlewareNode[] = []
  private _named: { [alias: string]: ResolvedMiddlewareNode } = {}

  /**
   * Resolves the middleware node based upon it's type
   */
  private _resolveMiddlewareItem (middleware: MiddlewareNode): ResolvedMiddlewareNode {
    return typeof(middleware) === 'string' ? {
      type: 'class',
      value: middleware,
      args: [],
    } : {
      type: 'function',
      value: middleware,
      args: [],
    }
  }

  /**
   * Register an array of global middleware. These middleware are read
   * by HTTP server and executed on every request
   */
  public register (middleware: MiddlewareNode[]): this {
    this._list = middleware.map(this._resolveMiddlewareItem.bind(this))
    return this
  }

  /**
   * Register named middleware that can be referenced later on routes
   */
  public registerNamed (middleware: { [alias: string]: MiddlewareNode }): this {
    this._named = Object.keys(middleware).reduce((result, alias) => {
      result[alias] = this._resolveMiddlewareItem(middleware[alias])
      return result
    }, {})

    return this
  }

  /**
   * Return all middleware registered using [[MiddlewareStore.register]]
   * method
   */
  public get (): ResolvedMiddlewareNode[] {
    return this._list
  }

  /**
   * Returns a single middleware by it's name registered
   * using [[MiddlewareStore.registerNamed]] method.
   */
  public getNamed (name: string): null | ResolvedMiddlewareNode {
    return this._named[name] || null
  }

  /**
   * A helper method to process route middleware using the middleware
   * store. Resolved middleware will be attached to `route.meta`
   * property, which can be read later by the middleware
   * processing layer.
   */
  public routeMiddlewareProcessor (route) {
    route.meta.resolvedMiddleware = route.middleware.map((item) => {
      if (typeof (item) === 'function') {
        return { type: 'function', value: item, args: [] }
      }

      const [ { name, args } ] = haye.fromPipe(item).toArray()

      const resolvedMiddleware = this.getNamed(name)
      if (!resolvedMiddleware) {
        throw new Exception(`Cannot find named middleware ${name}`, 500, 'E_MISSING_NAMED_MIDDLEWARE')
      }

      resolvedMiddleware.args = args
      return resolvedMiddleware
    })
  }
}
