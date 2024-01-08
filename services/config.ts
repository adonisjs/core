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

let config: ApplicationService['config']

/**
 * The config service uses the config instance from the app service
 */
await app.booted(() => {
  config = app.config
})

export { config as default }
