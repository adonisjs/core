/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { RequestContract } from '@adonisjs/request'
import { ConfigReader } from '@adonisjs/utils'
import * as coBody from 'co-body'
import { BodyParserConfig } from '../Contracts'

/**
 * The default body parser config
 */
const DEFAULTS: BodyParserConfig = {
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    encoding: 'utf-8',
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },
  form: {
    encoding: 'utf-8',
    limit: '1mb',
    types: [
      'application/x-www-form-urlencoded',
    ],
  },
  raw: {
    encoding: 'utf-8',
    limit: '1mb',
    types: [
      'text/*',
    ],
  },
}

/**
 * Cached config copy with default config
 */
const $ = new ConfigReader<BodyParserConfig>(DEFAULTS)

/**
 * BodyParser middleware parses the incoming request body and set it as
 * request body.
 */
export class BodyParserMiddleware {
  constructor (private _config: Partial<BodyParserConfig>) {
  }

  /**
   * Returns config for a given type
   */
  private _getConfigFor (type: 'raw' | 'json' | 'form') {
    const config = $.get(this._config, type)
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
   * Handle HTTP request body by parsing it as per the user
   * config
   */
  public async handle ({ request }: { request: RequestContract }, next): Promise<void> {
    /**
     * Only process for whitelisted nodes
     */
    if ($.get(this._config, 'whitelistedMethods').indexOf(request.method()) === -1) {
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
     * Handle url-encoded form data
     */
    const formConfig = this._getConfigFor('form')
    if (this._isType(request, formConfig.types)) {
      const { parsed, raw } = await coBody.form(request.request, formConfig)
      request.setInitialBody(parsed)
      request.updateRawBody(raw)
      return next()
    }

    /**
     * Handle content with JSON types
     */
    const jsonConfig = this._getConfigFor('json')
    if (this._isType(request, jsonConfig.types)) {
      const { parsed, raw } = await coBody.json(request.request, jsonConfig)
      request.setInitialBody(parsed)
      request.updateRawBody(raw)
      return next()
    }

    /**
     * Handles raw request body
     */
    const rawConfig = this._getConfigFor('raw')
    if (this._isType(request, rawConfig.types)) {
      const { raw } = await coBody.text(request.request, rawConfig)
      request.setInitialBody({})
      request.updateRawBody(raw)
      return next()
    }

    await next()
  }
}
