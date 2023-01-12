/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import { Router } from '../modules/http.js'
import type { HttpRouterService } from '../src/types.js'

let route: HttpRouterService

/**
 * Returns a singleton instance of the router class from
 * the container
 */
await app.booted(async () => {
  route = await app.container.make(Router)
})

export { route as default }
