/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
let appInstance: ApplicationContract

export function setApp(app: ApplicationContract) {
  appInstance = app
}

export function getApp(): ApplicationContract {
  if (!appInstance) {
    throw new Error('Cannot get AdonisJS application instance. Make sure to boot the application')
  }

  return appInstance
}
