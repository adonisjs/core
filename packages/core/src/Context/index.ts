/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { Request } from '@adonisjs/request'
import { Response } from '@adonisjs/response'
import { Macroable } from 'macroable'
import { ContextContract } from '../Contracts/Context'

/**
 * A simple class to hold values to be passed to the HTTP
 * request handler.
 *
 * At bare minimum [[Context]] will have [[Request]] and [[Response]]
 * objects.
 */
export class Context extends Macroable implements ContextContract {
  protected static _macros = {}
  protected static _getters = {}

  public request: Request
  public response: Response

  constructor (req: IncomingMessage, res: ServerResponse) {
    super()
    this.request = new Request(req, res, {})
    this.response = new Response(req, res, {})
  }
}
