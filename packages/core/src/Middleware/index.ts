/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {
  MiddlewareContract,
  MiddlewareNode,
} from '../Contracts/Middleware'

type Tag = {
  named: {
    [alias: string]: MiddlewareNode,
  },
  global: MiddlewareNode[],
}

export class Middleware implements MiddlewareContract {
  private _tags: { [name: string]: Tag } = {}

  public register (tag: string, middleware: MiddlewareNode[]): this {
    this._tags[tag] = this._tags[tag] || { named: {}, global: [] }
    this._tags[tag].global = middleware
    return this
  }

  public registerNamed (tag: string, middleware: { [alias: string]: MiddlewareNode }): this {
    this._tags[tag] = this._tags[tag] || { named: {}, global: [] }
    this._tags[tag].named = middleware
    return this
  }

  public get (tag: string): MiddlewareNode[] {
    const store = this._tags[tag]
    if (!store) {
      return []
    }

    return store.global
  }

  public getNamed (tag: string, name: string): null | MiddlewareNode {
    const store = this._tags[tag]
    if (!store) {
      return null
    }

    return store.named[name] || null
  }
}
