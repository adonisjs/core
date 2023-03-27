/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { HttpRouterService } from '../src/types.js'

let router: HttpRouterService

/**
 * Returns a singleton instance of the router class from
 * the container
 */
await app.booted(async () => {
  router = await app.container.make('router')
})

export { router as default }
