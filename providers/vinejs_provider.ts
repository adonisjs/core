/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Vine } from '@vinejs/vine'
import type { ApplicationService } from '../src/types.js'
import { Request, RequestValidator } from '../modules/http/main.js'
import { FileRuleValidationOptions, VineMultipartFile } from '../src/vine.js'

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

/**
 * The Edge service provider configures Edge to work within
 * an AdonisJS application environment
 */
export default class VineJSServiceProvider {
  constructor(protected app: ApplicationService) {
    this.app.usingVineJS = true
  }

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
    Request.macro('validateUsing', function (this: Request, ...args) {
      return new RequestValidator(this.ctx!, experimentalFlags).validateUsing(...args)
    })
  }
}
