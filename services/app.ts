/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '../src/types.js'

let app: ApplicationService

/**
 * Set the application instance the app service should
 * be using. Other services relies on the same app
 * instance as well.
 *
 * app service is an instance of the "Application" exported from
 * the "modules/app.ts" file.
 */
export function setApp(appService: ApplicationService) {
  app = appService
}

export { app as default }
