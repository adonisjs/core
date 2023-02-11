/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { errors as aceErrors } from '@adonisjs/ace'
import { errors as envErrors } from '@adonisjs/env'
import { errors as appErrors } from '@adonisjs/application'
import { errors as encryptionErrors } from '@adonisjs/encryption'
import { errors as httpServerErrors } from '@adonisjs/http-server'

export { stubsRoot } from './stubs/index.js'
export { inject } from './modules/container.js'
export { Ignitor } from './src/ignitor/main.js'

export const errors = {
  ...encryptionErrors,
  ...httpServerErrors,
  ...appErrors,
  ...aceErrors,
  ...envErrors,
}
