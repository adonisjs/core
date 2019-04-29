/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RequestConstructorContract } from '@adonisjs/request'
import { FileValidationOptions, MultipartFileContract } from '@adonisjs/bodyparser'

/**
 * Adds `file` macro the request object to read uploaded files
 */
export function requestBindings (Request: RequestConstructorContract) {
  Request.macro('file', function getFile (key: string, options?: Partial<FileValidationOptions>) {
    const file = this._files[key]
    if (!file) {
      return null
    }

    if (options) {
      if (file instanceof Array) {
        (file as MultipartFileContract[]).forEach((one) => one.setValidationOptions(options))
      } else {
        (file as MultipartFileContract).setValidationOptions(options)
      }
    }

    return file
  })
}
