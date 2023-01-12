/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { ApplicationService } from '../src/types.js'

let logger: ApplicationService['logger']

/**
 * Returns a reference of logger from the app service
 */
await app.booted(async () => {
  logger = app.logger
})

export { logger as default }
