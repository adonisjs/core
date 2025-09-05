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

import type { HttpContext } from './main.ts'
import type { FeatureFlags } from '../app.ts'
import type { ExperimentalFlagsList } from '../../types/app.ts'
import type { RequestValidationOptions } from '../../types/http.ts'

/**
 * Request validator for validating HTTP request data using VineJS validators.
 * This class provides a convenient way to validate request body, files, cookies,
 * headers, and URL parameters in AdonisJS applications.
 *
 * @example
 * ```ts
 * // Inside a controller method
 * const data = await request.validateUsing(createUserValidator, {
 *   messagesProvider: customMessages
 * })
 * ```
 */
export class RequestValidator {
  #ctx: HttpContext
  #experimentalFlags?: FeatureFlags<ExperimentalFlagsList>

  constructor(ctx: HttpContext, experimentalFlags?: FeatureFlags<ExperimentalFlagsList>) {
    this.#ctx = ctx
    this.#experimentalFlags = experimentalFlags
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
   * Validate the current HTTP request data using a VineJS validator.
   * This method automatically includes request body, files, URL parameters,
   * headers, and cookies in the validation data.
   *
   * @param validator - VineJS validator instance
   * @param options - Optional validation options including custom error reporters and messages
   *
   * @example
   * ```ts
   * const createUserValidator = vine.compile(
   *   vine.object({
   *     email: vine.string().email(),
   *     name: vine.string().minLength(3)
   *   })
   * )
   *
   * const data = await request.validateUsing(createUserValidator, {
   *   errorReporter: () => vine.errors.SimpleErrorReporter,
   *   messagesProvider: customMessages
   * })
   * ```
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

    const requestBody = this.#experimentalFlags?.enabled('mergeMultipartFieldsAndFiles')
      ? this.#ctx.request.all()
      : {
          ...this.#ctx.request.all(),
          ...this.#ctx.request.allFiles(),
        }

    /**
     * Data to validate
     */
    const data = validatorOptions.data || {
      ...requestBody,
      params: this.#ctx.request.params(),
      headers: this.#ctx.request.headers(),
      cookies: this.#ctx.request.cookiesList(),
    }

    return validator.validate(data, validatorOptions as any)
  }
}
