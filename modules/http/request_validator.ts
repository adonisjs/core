/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { VineValidator } from '@vinejs/vine'
import type {
  Infer,
  SchemaTypes,
  ErrorReporterContract,
  MessagesProviderContact,
} from '@vinejs/vine/types'

import type { HttpContext } from './main.js'
import type { RequestValidationOptions } from '../../types/http.js'

/**
 * Request validator is used validate HTTP request data using
 * VineJS validators. You may validate the request body,
 * files, cookies, and headers.
 */
export class RequestValidator {
  #ctx: HttpContext

  constructor(ctx: HttpContext) {
    this.#ctx = ctx
  }

  /**
   * The error reporter method returns the error reporter
   * to use for reporting errors.
   *
   * You can use this function to pick a different error reporter
   * for each HTTP request
   */
  static errorReporter?: (_: HttpContext) => ErrorReporterContract

  /**
   * The messages provider method returns the messages provider to use
   * finding custom error messages
   *
   * You can use this function to pick a different messages provider for
   * each HTTP request
   */
  static messagesProvider?: (_: HttpContext) => MessagesProviderContact

  /**
   * The validate method can be used to validate the request
   * data for the current request using VineJS validators
   */
  validateUsing<Schema extends SchemaTypes, MetaData extends undefined | Record<string, any>>(
    validator: VineValidator<Schema, MetaData>,
    ...[options]: [undefined] extends MetaData
      ? [options?: RequestValidationOptions<MetaData> | undefined]
      : [options: RequestValidationOptions<MetaData>]
  ): Promise<Infer<Schema>> {
    const validatorOptions: RequestValidationOptions<any> = options || {}

    /**
     * Assign request specific error reporter
     */
    if (RequestValidator.errorReporter && !validatorOptions.errorReporter) {
      const errorReporter = RequestValidator.errorReporter(this.#ctx)
      validatorOptions.errorReporter = () => errorReporter
    }

    /**
     * Assign request specific messages provider
     */
    if (RequestValidator.messagesProvider && !validatorOptions.messagesProvider) {
      validatorOptions.messagesProvider = RequestValidator.messagesProvider(this.#ctx)
    }

    /**
     * Data to validate
     */
    const data = validatorOptions.data || {
      ...this.#ctx.request.all(),
      ...this.#ctx.request.allFiles(),
      params: this.#ctx.request.params(),
      headers: this.#ctx.request.headers(),
      cookies: this.#ctx.request.cookiesList(),
    }

    return validator.validate(data, validatorOptions as any)
  }
}
