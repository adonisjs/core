/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Readable } from 'stream'

/**
 * Readable stream along with some extra
 * data
 */
export type MultipartStream = Readable & {
  headers: any,
  name: string,
  filename: string,
  byteOffset: number,
  byteCount: number,
}

/**
 * Stream part handler
 */
export type PartHandler = (file: MultipartStream) => Promise<void>

/**
 * Field handler
 */
export type FieldHandler = (key: string, value: string) => void

/**
 * Multipart class contract, since it's exposed on the
 * request object, we need the interface to extend
 * typings
 */
export interface MultipartContract {
  consumed: boolean,
  process (): Promise<void>,
  onFile (name: string, callback: PartHandler): this
}

/**
 * Qs module config
 */
type QueryStringConfig = {
  depth?: number,
  allowPrototypes?: boolean,
  plainObjects?: boolean,
  parameterLimit?: number,
  arrayLimit?: number,
  ignoreQueryPrefix?: boolean,
  delimiter?: RegExp | string,
  allowDots?: boolean,
  charset?: string,
  charsetSentinel?: boolean,
  interpretNumericEntities?: boolean,
  parseArrays?: boolean,
  comma?: boolean,
}

/**
 * Body parser config for all different types
 */
export type BodyParserConfig = {
  whitelistedMethods: string[],
  json: {
    encoding?: string,
    limit?: string | number,
    strict?: boolean,
    types: string[],
  },
  form: {
    encoding?: string,
    limit?: string | number,
    queryString?: QueryStringConfig,
    types: string[],
  },
  raw: {
    encoding?: string,
    limit?: string | number,
    queryString?: QueryStringConfig,
    types: string[],
  },
}
