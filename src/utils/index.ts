/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { esmRequire } from '@poppinss/utils'

/**
 * Helper to know if error belongs to a missing module
 * error
 */
export function isMissingModuleError (error: NodeJS.ErrnoException) {
  return ['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code!)
}

/**
 * Optionally require the file and ignore non existing errors
 */
export function optionalRequire (filePath: string, optional = false): any | null {
  try {
    return esmRequire(filePath)
  } catch (error) {
    if (isMissingModuleError(error) && optional) {
      return null
    }

    throw error
  }
}

/**
 * Exit process only when not running module tests
 */
export function exitProcess (signal: number) {
  if (process.env.MODULE_TESTING) {
    return
  }

  process.exit(signal)
}
