/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { Router } from '@adonisjs/router'
import { Context } from '../Context'
import { Middleware } from 'co-compose'

// type Handler = string | ((ctx: Context) => void)

export class Server {
  private _globalMiddleware = new Middleware()
  // private _namedMiddleware: { [name: string]: Handler } = {}
  // private _resolvedMiddleware: { [name: string]: Handler } = {}

  constructor (private _router: Router) {
  }

  /**
   * Define an array of global middleware.
   */
  public globalMiddleware (middleware: any[]): this {
    this._globalMiddleware.register(middleware)
    return this
  }

  /**
   * Define a set of named middleware. Named middleware are just aliases
   * to the actual namespaces
   */
  // public namedMiddleware (middleware: { [name: string]: Handler }): this {
  //   this._namedMiddleware = middleware
  //   return this
  // }

  public async handle (req: IncomingMessage, res: ServerResponse) {
    const ctx = new Context(req, res)
    const url = ctx.request.url()
    const method = ctx.request.method()

    const route = this._router.find(url, method)
    if (route) {
      await this._globalMiddleware.runner().run([ctx])
      await route.route.handler(ctx)
      return
    }

    ctx.response.status(404).send(`Cannot ${method}:${url}`)
  }
}
