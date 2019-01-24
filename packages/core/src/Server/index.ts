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

type Handler = (ctx: Context) => void

export class Server {
  private _hooks: {
    before: Handler[],
    after: Handler[],
  } = {
    before: [],
    after: [],
  }

  constructor (private _router: Router) {
  }

  public onRequest (handler: Handler): this {
    this._hooks.before.push(handler)
    return this
  }

  public onResponse (handler: Handler): this {
    this._hooks.after.push(handler)
    return this
  }

  public async handle (req: IncomingMessage, res: ServerResponse) {
    const ctx = new Context(req, res)

    // const route = this._router.find(request.url(), request.method())
    // if (route) {
    //   await route.route.handler({ request, response })
    //   return
    // }

    // response.status(404).send(`Cannot ${request.method()}:${request.url()}`)
  }
}
