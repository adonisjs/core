/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import { homedir } from 'os'
import { Exception } from '@adonisjs/utils'

import { File } from './File'
import { Multipart } from './index'
import { streamFile } from './streamFile'
import { FormFields } from '../FormFields'
import { BodyParserMultipartConfig } from '../Contracts'

/**
 * Processes the incoming multipart stream by moving files to the
 * tmp directory and return `files` and `fields` data map.
 */
export async function processMultipart (multipart: Multipart, config: BodyParserMultipartConfig) {
  let totalBytes = 0
  const fields = new FormFields()
  const files = new FormFields()

  /**
   * Reading all fields data
   */
  multipart.onField('*', (key, value) => {
    if (key) {
      fields.add(key, value)
    }
  })

  /**
   * Reading all files data
   */
  multipart.onFile('*', async (part) => {
    const tmpPath = join(homedir(), config.tmpFileName())
    let bytes = 0

    /**
     * Stream the file to tmpPath, but also keep an
     * eye on total bytes
     */
    await streamFile(part, tmpPath, (line: Buffer) => {
      const size = line.length
      bytes += size
      totalBytes += size

      /**
       * Ensure request data isn't getting over the defined limit. Otherwise,
       * we need to raise an exception
       */
      if (totalBytes > config.limit) {
        part.emit(
          'error',
          new Exception('request entity too large', 413, 'E_REQUEST_ENTITY_TOO_LARGE'),
        )
      }
    })

    /**
     * Creating [[File]] instance for interacting with the
     * files at later stage
     */
    const file = new File({
      fileName: part.filename,
      fieldName: part.name,
      tmpPath: tmpPath,
      bytes: bytes,
      headers: part.headers,
    })

    files.add(file.fieldName, file)
  })

  /**
   * Start reading data from the stream
   */
  await multipart.process()

  return {
    fields: fields.get(),
    files: files.get(),
  }
}
