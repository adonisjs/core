/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export * from '@adonisjs/http-server/types'
import type { ValidationOptions } from '@vinejs/vine/types'

/**
 * Validation options accepted by the "request.validateUsing" method
 */
export type RequestValidationOptions<MetaData extends undefined | Record<string, any>> =
  ValidationOptions<MetaData> & { data?: any }
