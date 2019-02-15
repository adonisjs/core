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
