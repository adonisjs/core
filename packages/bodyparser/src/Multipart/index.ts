/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as multiparty from 'multiparty'
import { Exception } from '@adonisjs/utils'
import { IncomingMessage } from 'http'

import {
  MultipartContract,
  PartHandler,
  MultipartStream,
  FieldHandler,
} from '../Contracts'

/**
 * Multipart class offers a low level API to interact the incoming
 * HTTP request data as a stream. This makes it super easy to
 * write files to s3 without saving them to the disk first.
 *
 * ### Usage
 *
 * ```ts
 * const multipart = new Multipart(options)
 *
 * multipart.onFile('profile', async (stream) => {
 *  stream.pipe(fs.createWriteStream('./profile.jpg'))
 * })
 *
 * try {
 *   await multipart.process()
 * } catch (error) {
 *   // all errors are sent to the process method
 * }
 * ```
 */
export class Multipart implements MultipartContract {
  private _handlers: {
    files: { [key: string]: PartHandler },
    fields: { [key: string]: FieldHandler },
  } = {
    files: {},
    fields: {},
  }

  private _pendingHandlers = 0
  private _gotHandlers = false

  /**
   * Consumed is set to true when `process` is called. Calling
   * process multiple times is not possible and hence this
   * boolean must be checked first
   */
  public consumed = false

  constructor (private _request: IncomingMessage) {
  }

  /**
   * Returns a boolean telling whether all streams have been
   * consumed along with all handlers execution
   */
  private _isClosed (form): boolean {
    return form.flushing <= 0 && this._pendingHandlers <= 0
  }

  /**
   * Removes array like expression from the part name to
   * find the handler
   */
  private _getHandlerName (name): string {
    return name.replace(/\[\d*\]/, '')
  }

  /**
   * Handles a given part by invoking it's handler or
   * by resuming the part, if there is no defined
   * handler
   */
  private async _handlePart (part: MultipartStream) {
    const name = this._getHandlerName(part.name)
    const handler = this._handlers.files[name] || this._handlers.files['*']
    if (!handler) {
      part.resume()
      return
    }

    this._pendingHandlers++
    await handler(part)
    this._pendingHandlers--
  }

  /**
   * Passes field key value pair to the pre-defined handler
   */
  private _handleField (key: string, value: string) {
    const handler = this._handlers.fields[key] || this._handlers.fields['*']
    if (!handler) {
      return
    }

    handler(key, value)
  }

  /**
   * Attach handler for a given file. To handle all files, you
   * can attach a wildcard handler. Also only can handler
   * can be defined, since processing a stream at multiple
   * locations is not possible.
   *
   * @example
   * ```
   * multipart.onFile('package', async (stream) => {
   * })
   *
   * multipart.onFile('*', async (stream) => {
   * })
   * ```
   */
  public onFile (name: string, handler: PartHandler): this {
    this._gotHandlers = true
    this._handlers.files[name] = handler
    return this
  }

  /**
   * Get notified on a given field
   */
  public onField (name: string, handler: FieldHandler): this {
    this._gotHandlers = true
    this._handlers.fields[name] = handler
    return this
  }

  /**
   * Process the request by going all the file and field
   * streams.
   */
  public process (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.consumed) {
        reject(new Exception('multipart stream has already been consumed', 500, 'E_CONSUMED_MULTIPART_STREAM'))
        return
      }
      this.consumed = true

      /**
       * Do not get into the process of parsing the request, when
       * no one is listening for the fields or files.
       */
      if (!this._gotHandlers) {
        resolve()
        return
      }

      const form = new multiparty.Form()

      /**
       * Raise error when form encounters an
       * error
       */
      form.on('error', reject)

      /**
       * Process each part at a time and also resolve the
       * promise when all parts are consumed and processed
       * by their handlers
       */
      form.on('part', async (part) => {
        try {
          await this._handlePart(part)

          /**
           * When a stream finishes before the handler, the close `event`
           * will not resolve the current Promise. So in that case, we
           * check and resolve from here
           */
          if (this._isClosed(form)) {
            resolve()
          }
        } catch (error) {
          form.emit('error', error)
        }
      })

      /**
       * Listen for fields
       */
      form.on('field', (key, value) => {
        try {
          this._handleField(key, value)
        } catch (error) {
          form.emit('error', error)
        }
      })

      /**
       * Resolve promise on close, when all internal
       * file handlers are done processing files
       */
      form.on('close', () => {
        if (this._isClosed(form)) {
          resolve()
        }
      })

      form.parse(this._request)
    })
  }
}
