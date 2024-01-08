/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { EncryptionService } from '../src/types.js'

let encryption: EncryptionService

/**
 * Returns a singleton instance of the encryption class
 * from the container
 */
await app.booted(async () => {
  encryption = await app.container.make('encryption')
})

export { encryption as default }
