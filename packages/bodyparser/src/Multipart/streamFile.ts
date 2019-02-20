/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as eos from 'end-of-stream'
import { open, close, createWriteStream, unlink } from 'fs-extra'
import { Readable } from 'stream'

/**
 * Writes readable stream to the given location by properly cleaning up readable
 * and writable streams in case of any errors. Also an optional data listener
 * can listen for the `data` event.
 */
export function streamFile (readStream: Readable, location: string, dataListener?): Promise<void> {
  return new Promise((resolve, reject) => {
    open(location, 'w')
      .then((fd) => {
        /**
         * Create write stream and reject promise on error
         * event
         */
        const writeStream = createWriteStream(location)
        writeStream.on('error', reject)

        /**
         * Handle closing of read stream from multiple sources
         */
        eos(readStream, (error) => {
          close(fd)

          /**
           * Resolve when their are no errors in
           * streaming
           */
          if (!error) {
            resolve()
            return
          }

          /**
           * Otherwise cleanup write stream
           */
          reject(error)

          process.nextTick(() => {
            writeStream.end()
            unlink(writeStream.path).catch(() => {})
          })
        })

        if (typeof (dataListener) === 'function') {
          readStream.on('data', dataListener)
        }

        readStream.pipe(writeStream)
      })
      .catch(reject)
  })
}
