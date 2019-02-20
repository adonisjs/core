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
  bytes: number,
}

/**
 * File validation options
 */
export type FileValidationOptions = {
  size: string | number,
  types: string[],
  extnames: string[],
}

/**
 * Stream part handler
 */
export type PartHandler = (part: MultipartStream) => Promise<void>

/**
 * Field handler
 */
export type FieldHandler = (key: string, value: string) => void

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
 * Base config used by all types
 */
export type BodyParserBaseConfig = {
  encoding: string,
  limit: string | number,
  types: string[],
}

/**
 * Body parser config for parsing JSON requests
 */
export type BodyParserJSONConfig = BodyParserBaseConfig & {
  strict: boolean,
}

/**
 * Parser config for parsing form data
 */
export type BodyParserFormConfig = BodyParserBaseConfig & {
  queryString: QueryStringConfig,
}

/**
 * Parser config for parsing raw body (untouched)
 */
export type BodyParserRawConfig = BodyParserBaseConfig & {
  queryString: QueryStringConfig,
}

/**
 * Parser config for parsing multipart requests
 */
export type BodyParserMultipartConfig = BodyParserBaseConfig & {
  autoProcess: boolean,
  processManually: string[],
  tmpFileName (): string,
}

/**
 * Body parser config for all different types
 */
export type BodyParserConfig = {
  whitelistedMethods: string[],
  json: BodyParserJSONConfig,
  form: BodyParserFormConfig,
  raw: BodyParserRawConfig,
  multipart: BodyParserMultipartConfig,
}

/**
 * Multipart class contract, since it's exposed on the
 * request object, we need the interface to extend
 * typings
 */
export interface MultipartContract {
  consumed: boolean,
  process (): Promise<void>,
  onFile (name: string, callback: PartHandler): this
  onField (key: string, value: any): this
}

/**
 * Error shape for file upload errors
 */
export type FileUploadError = {
  fieldName: string,
  clientName: string,
  message: string,
  type: 'size' | 'extname',
}

/**
 * New file constructor options shape
 */
export type FileInputNode = {
  fieldName: string,
  fileName: string,
  tmpPath: string,
  bytes: number,
  headers: {
    [key: string]: string,
  },
}

/**
 * Multipart file interface, used to loose coupling
 */
export interface MultipartFileContract {
  moved: boolean,
  isValid: boolean,
  clientName: string,
  fileName?: string,
  fieldName: string,
  tmpPath: string,
  size: number,
  type?: string,
  subtype?: string,
  status: 'pending' | 'moved' | 'error',
  extname: string,
  setValidationOptions (options: Partial<FileValidationOptions>): this,
  errors: FileUploadError[]
}
