/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import { Repl } from '@adonisjs/repl'

let repl: Repl

/**
 * Returns a singleton instance of the repl class from
 * the container
 */
await app.booted(async () => {
  repl = await app.container.make('repl')
})

export { repl as default }
