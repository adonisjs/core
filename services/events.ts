/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import { Emitter } from '../modules/events.js'
import type { EmitterService } from '../src/types.js'

let events: EmitterService

/**
 * Returns a singleton instance of the emitter class
 * from the container
 */
await app.booted(async () => {
  events = await app.container.make(Emitter)
})

export { events as default }
