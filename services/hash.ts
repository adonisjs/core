/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { HashService } from '../src/types.js'
import { HashManager } from '../modules/hash/main.js'

let hash: HashService

/**
 * Returns a singleton instance of the Hash manager from the
 * container
 */
await app.booted(async () => {
  hash = await app.container.make(HashManager)
})

export { hash as default }
