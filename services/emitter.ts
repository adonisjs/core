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
import { AbstractConstructor } from '@adonisjs/fold/types'

let emitter: EmitterService

/**
 * Returns a singleton instance of the emitter class
 * from the container
 */
await app.booted(async () => {
  emitter = await app.container.make<AbstractConstructor<EmitterService>>(Emitter)
})

export { emitter as default }
