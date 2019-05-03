/**
* @module Http.Response
*/

/*
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MacroableConstructorContract } from 'macroable'
import { ServerResponse, IncomingMessage } from 'http'
import { CookieOptions } from '@adonisjs/cookie'

/**
 * Types from which response header can be casted to a
 * string
 */
export type CastableHeader = string | number | boolean | string[] | number[] | boolean[]

/**
 * Content types after processing response body
 */
export type ResponseContentType =
  'text/html' |
  'text/plain' |
  'application/octet-stream' |
  'application/json' |
  'unknown' |
  'null'

/**
 * Types of readable stream allowed for HTTP response
 */
export type ResponseStream = NodeJS.ReadStream | NodeJS.ReadWriteStream | NodeJS.ReadableStream

/**
 * Lazy body packet
 */
export type LazyBody = {
  writer: any,
  args: any[],
}

/**
 * Config accepted by response class
 */
export type ResponseConfig = {
  etag: boolean,
  jsonpCallbackName: string,
  cookie: Partial<CookieOptions>,
}

/**
 * Main response interface
 */
export interface ResponseContract {
  explicitEnd: boolean
  hasLazyBody: boolean
  lazyBody: LazyBody | null
  finished: boolean
  headersSent: boolean
  isPending: boolean
  request: IncomingMessage
  response: ServerResponse

  getHeader (key: string): string | string[] | number | undefined
  header (key: string, value: CastableHeader): this
  append (key: string, value: CastableHeader): this
  safeHeader (key: string, value: CastableHeader): this
  removeHeader (key: string): this

  status (code: number): this
  safeStatus (code: number): this
  type (type: string, charset?: string): this
  vary (field: string): this
  setEtag (body: any, weak?: boolean): this

  buildResponseBody (body: any): { body: any, type: ResponseContentType, originalType?: string }
  send (body: any, generateEtag?: boolean): void
  json (body: any, generateEtag?: boolean): void
  jsonp (body: any, callbackName?: string, generateEtag?: boolean): void

  stream (stream: ResponseStream, raiseErrors?: boolean): Promise<Error | void>
  download (filePath: string, generateEtag?: boolean, raiseErrors?: boolean): Promise<Error | void>
  attachment (
    filePath: string,
    name?: string,
    disposition?: string,
    generateEtag?: boolean,
    raiseErrors?: boolean,
  ): Promise<Error | void>

  location (url: string): this
  redirect (url: string, reflectQueryParams?: boolean, statusCode?: number): void

  cookie (key: string, value: any, options?: CookieOptions): this
  plainCookie (key: string, value: any, options?: CookieOptions): this
  clearCookie (key: string): this

  finish (): void
}

/**
 * Constructor contract is required coz of static methods
 * on the response class
 */
export interface ResponseConstructorContract extends MacroableConstructorContract {
  new (request: IncomingMessage, response: ServerResponse, config: Partial<ResponseConfig>): ResponseContract
}
