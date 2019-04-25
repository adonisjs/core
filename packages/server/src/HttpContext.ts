/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RouteNode } from '@adonisjs/router'
import { RequestContract } from '@adonisjs/request'
import { ResponseContract } from '@adonisjs/response'
import { HttpContextContract } from './Contracts'

export class HttpContext implements HttpContextContract {
  public params: any
  public subdomains: any
  public route: RouteNode

  constructor (public request: RequestContract, public response: ResponseContract) {
  }
}
