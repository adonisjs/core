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

export type ValidationOptions =
  | Partial<FileValidationOptions>
  | ((field: FieldContext) => Partial<FileValidationOptions>)

/**
 * Notifying TypeScript
 */
declare module '@vinejs/vine' {
  interface Vine {
    file(options?: ValidationOptions): VineMultipartFile
  }
}
