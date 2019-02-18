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
import { Exception } from '@adonisjs/utils'

/**
 * Streams file to the destination by monitoring it's size and raising
 * error, if it's over limit.
 */
export function streamFile (
  readStream: Readable,
  location: string,
  limit?: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let size = 0

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
            resolve(size)
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

        /**
         * Hook into data event for knowing the file size
         * and raising error if it's over the limit
         */
        readStream.on('data', (line) => {
          size += line.length

          if (limit && size > limit) {
            readStream.emit(
              'error',
              new Exception('stream size exceeded', 500, 'E_UNALLOWED_FILE_SIZE'),
            )
          }
        })

        readStream.pipe(writeStream)
      })
      .catch(reject)
  })
}
