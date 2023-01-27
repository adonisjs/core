/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { Kernel } from '../modules/ace/main.js'

let ace: Kernel

/**
 * Returns a singleton instance of the ace kernel
 * from the container
 */
await app.booted(async () => {
  ace = await app.container.make('ace')
})

export { ace as default }
