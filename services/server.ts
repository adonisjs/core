/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { HttpServerService } from '../src/types.js'

let server: HttpServerService

/**
 * Returns a singleton instance of the HTTP server
 * from the container
 */
await app.booted(async () => {
  server = await app.container.make('server')
})

export { server as default }
