/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MiddlewareStoreContract, MiddlewareNode } from '../Contracts/Middleware'

export class MiddlewareStore implements MiddlewareStoreContract {
  private _list: MiddlewareNode[] = []
  private _named: { [alias: string]: MiddlewareNode } = {}

  public register (middleware: MiddlewareNode[]): this {
    this._list = middleware
    return this
  }

  public registerNamed (middleware: { [alias: string]: MiddlewareNode }): this {
    this._named = middleware
    return this
  }

  public get (): MiddlewareNode[] {
    return this._list
  }

  public getNamed (name: string): null | MiddlewareNode {
    return this._named[name] || null
  }
}
