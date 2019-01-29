/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RequestContract } from '@adonisjs/request'
import { ResponseContract } from '@adonisjs/response'
import { ContextContract } from './Contracts'

export class Context implements ContextContract {
  public params
  public subdomains
  public route

  constructor (public request: RequestContract, public response: ResponseContract) {
  }
}
