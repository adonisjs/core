/*
* @adonisjs/response
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { ResponseConfig } from '../src/ResponseContract'

export const config: ResponseConfig = {
  etag: false,
  jsonpCallbackName: 'callback',
}
