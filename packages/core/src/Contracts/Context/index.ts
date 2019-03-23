/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import {
  HttpContextContract as BaseContextContract,
  HooksHttpContextContract as BaseHooksContextContract,
} from '@adonisjs/server'

import {
  RequestContract as BaseRequestContract,
} from '@adonisjs/request'

import {
  FileValidationOptions,
  MultipartFileContract,
  MultipartContract,
} from '@adonisjs/bodyparser'

/**
 * Here we add bodyparser extended properties to the request
 * interface
 */
export interface RequestContract extends BaseRequestContract {
  file (key: string, options: FileValidationOptions): null | MultipartFileContract | MultipartFileContract[]
  multipart (): MultipartContract
}

/**
 * Updating request on hooks context contract
 */
export interface HooksHttpContextContract extends BaseHooksContextContract {
  request: RequestContract,
}

/**
 * Updating request on context contract
 */
export interface HttpContextContract extends BaseContextContract {
  request: RequestContract,
}
