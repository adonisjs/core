/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { FieldContext } from '@vinejs/vine/types'
import type { FileValidationOptions } from '@adonisjs/bodyparser/types'

import type { VineMultipartFile } from './main.js'
import type { RequestValidator } from '../../../modules/http/main.js'

/**
 * Validation options accepted by the "file" rule
 */
export type FileRuleValidationOptions =
  | Partial<FileValidationOptions>
  | ((field: FieldContext) => Partial<FileValidationOptions>)

/**
 * Extend VineJS
 */
declare module '@vinejs/vine' {
  interface Vine {
    file(options?: FileRuleValidationOptions): VineMultipartFile
  }
}

/**
 * Extend HTTP request class
 */
declare module '@adonisjs/core/http' {
  interface Request extends RequestValidator {}
}
