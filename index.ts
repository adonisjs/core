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
import { errors as encryptionErrors } from '@boringnode/encryption'
import { errors as httpServerErrors } from '@adonisjs/http-server'

export { stubsRoot } from './stubs/main.ts'
export { inject } from './modules/container.ts'
export { Ignitor } from './src/ignitor/main.ts'
export { configProvider } from './src/config_provider.ts'
export { indexEntities } from './src/assembler_hooks/index_entities.ts'

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
  if (error && typeof error === 'object' && error.code === 'E_DUMP_DIE_EXCEPTION') {
    console.error(error)
    return
  }

  try {
    const { Youch } = await import('youch')
    const youch = new Youch()
    console.error(await youch.toANSI(error))
  } catch {
    console.error(error)
  }
}
