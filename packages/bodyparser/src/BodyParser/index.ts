/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as coBody from 'co-body'
import { Exception } from '@adonisjs/utils'
import { RequestContract } from '@adonisjs/request'

import { Multipart } from '../Multipart'
import { BodyParserConfig } from '../Contracts'
import { processMultipart } from '../Multipart/processMultipart'

/**
 * BodyParser middleware parses the incoming request body and set it as
 * request body to be read later in the request lifecycle.
 */
export class BodyParserMiddleware {
  constructor (private _config: BodyParserConfig) {
  }

  /**
   * Returns config for a given type
   */
  private _getConfigFor<K extends keyof BodyParserConfig> (type: K): BodyParserConfig[K] {
    const config = this._config[type]
    config['returnRawBody'] = true
    return config
  }

  /**
   * Ensures that types exists and have length
   */
  private _ensureTypes (types: string[]): boolean {
    return !!(types && types.length)
  }

  /**
   * Returns a boolean telling if request `content-type` header
   * matches the expected types or not
   */
  private _isType (request: RequestContract, types: string[]): boolean {
    return !!(this._ensureTypes(types) && request.is(types))
  }

  /**
   * Returns a proper Adonis style exception for popular error codes
   * returned by https://github.com/stream-utils/raw-body#readme.
   */
  private _getExceptionFor (error) {
    switch (error.type) {
      case 'encoding.unsupported':
        return new Exception(error.message, error.status, 'E_ENCODING_UNSUPPORTED')
      case 'entity.too.large':
        return new Exception(error.message, error.status, 'E_REQUEST_ENTITY_TOO_LARGE')
      case 'request.aborted':
        return new Exception(error.message, error.status, 'E_REQUEST_ABORTED')
      default:
        return error
    }
  }

  /**
   * Handle HTTP request body by parsing it as per the user
   * config
   */
  public async handle ({ request }: { request: RequestContract }, next): Promise<void> {
    /**
     * Only process for whitelisted nodes
     */
    if (this._config.whitelistedMethods.indexOf(request.method()) === -1) {
      return next()
    }

    /**
     * Return early when request body is empty. Many clients set the `Content-length = 0`
     * when request doesn't have any body, which is not handled by the below method.
     *
     * The main point of `hasBody` is to early return requests with empty body created by
     * clients with missing headers.
     */
    if (!request.hasBody()) {
      return next()
    }

    /**
     * Handle multipart form
     */
    const multipartConfig = this._getConfigFor('multipart')
    if (this._isType(request, multipartConfig.types)) {
      const multipart = new Multipart(request.request)
      const { files, fields } = await processMultipart(multipart, multipartConfig)

      request.setInitialBody(fields)
      request['_files'] = files
      return next()
    }

    /**
     * Handle url-encoded form data
     */
    const formConfig = this._getConfigFor('form')
    if (this._isType(request, formConfig.types)) {
      try {
        const { parsed, raw } = await coBody.form(request.request, formConfig)
        request.setInitialBody(parsed)
        request.updateRawBody(raw)
        return next()
      } catch (error) {
        throw this._getExceptionFor(error)
      }
    }

    /**
     * Handle content with JSON types
     */
    const jsonConfig = this._getConfigFor('json')
    if (this._isType(request, jsonConfig.types)) {
      try {
        const { parsed, raw } = await coBody.json(request.request, jsonConfig)
        request.setInitialBody(parsed)
        request.updateRawBody(raw)
        return next()
      } catch (error) {
        throw this._getExceptionFor(error)
      }
    }

    /**
     * Handles raw request body
     */
    const rawConfig = this._getConfigFor('raw')
    if (this._isType(request, rawConfig.types)) {
      try {
        const { raw } = await coBody.text(request.request, rawConfig)
        request.setInitialBody({})
        request.updateRawBody(raw)
        return next()
      } catch (error) {
        throw this._getExceptionFor(error)
      }
    }

    await next()
  }
}
