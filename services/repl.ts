/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.ts'
import type { Repl } from '../modules/repl.ts'

let repl: Repl

/**
 * Returns a singleton instance of the Repl class from
 * the container
 */
await app.booted(async () => {
  repl = await app.container.make('repl')
})

export { repl as default }
