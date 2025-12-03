/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Vine } from '@vinejs/vine'
import type { ApplicationService } from '../src/types.ts'
import { HttpRequest, RequestValidator } from '../modules/http/main.ts'
import { type FileRuleValidationOptions, VineMultipartFile } from '../src/vine.ts'

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
  interface HttpRequest extends RequestValidator {}
}

/**
 * The VineJS service provider integrates VineJS validation
 * library with AdonisJS application environment
 *
 * This provider sets up:
 * - File validation rule for multipart file uploads
 * - Request validation macro for easy validation in HTTP contexts
 * - Extension of VineJS with AdonisJS-specific validation features
 *
 * @example
 * const provider = new VineJSServiceProvider(app)
 * provider.boot()
 * // Now Request has validateUsing method
 */
export default class VineJSServiceProvider {
  /**
   * VineJS service provider constructor
   *
   * Sets the usingVineJS flag to true to indicate VineJS is being used.
   *
   * @param app - The application service instance
   */
  constructor(protected app: ApplicationService) {
    this.app.usingVineJS = true
  }

  /**
   * Boot the VineJS service provider
   *
   * Extends VineJS with file validation macro and adds validateUsing
   * method to the Request class for easy validation in HTTP contexts.
   *
   * @example
   * provider.boot()
   * // Now vine.file() and request.validateUsing() are available
   */
  boot() {
    const experimentalFlags = this.app.experimentalFlags

    /**
     * The file method is used to validate a field to be a valid
     * multipart file.
     */
    Vine.macro('file', function (this: Vine, options) {
      return new VineMultipartFile(options)
    })

    /**
     * The validate method can be used to validate the request
     * data for the current request using VineJS validators
     */
    HttpRequest.macro('validateUsing', function (this: HttpRequest, ...args) {
      return new RequestValidator(this.ctx!, experimentalFlags).validateUsing(...args)
    })
  }
}
