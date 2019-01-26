/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { RequestContract } from '@adonisjs/request'
import { ResponseContract } from '@adonisjs/response'

export interface ContextContract {
  request: RequestContract,
  response: ResponseContract
}
