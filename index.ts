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

export { stubsRoot } from './stubs/main.js'
export { inject } from './modules/container.js'
export { Ignitor } from './src/ignitor/main.js'
export { configProvider } from './src/config_provider.js'

/**
 * Aggregated errors from all modules.
 */
export const errors: typeof encryptionErrors &
  typeof httpServerErrors &
  typeof appErrors &
  typeof aceErrors &
  typeof envErrors = {
  ...encryptionErrors,
  ...httpServerErrors,
  ...appErrors,
  ...aceErrors,
  ...envErrors,
}

/**
 * Pretty prints an error with colorful output using
 * Youch terminal
 */
export async function prettyPrintError(error: any) {
  // @ts-expect-error
  const { default: youchTerminal } = await import('youch-terminal')
  const { default: Youch } = await import('youch')

  const youch = new Youch(error, {})
  console.error(youchTerminal(await youch.toJSON(), { displayShortPath: true }))
}
