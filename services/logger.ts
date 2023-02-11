/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import { LoggerManager } from '@adonisjs/logger'
import type { LoggerService } from '../src/types.js'

let logger: LoggerService

/**
 * Returns a singleton instance of the logger class
 * from the container
 */
await app.booted(async () => {
  logger = (await app.container.make(LoggerManager)) as LoggerService
})

export { logger as default }
