/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { esmRequire, resolveFrom } from '@poppinss/utils'

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
 * Optionally resolve and require the file and
 * ignore non existing errors
 */
export function optionalResolveAndRequire (
  filePath: string,
  fromPath: string,
  optional = false,
): any | null {
  try {
    return optionalRequire(resolveFrom(fromPath, filePath))
  } catch (error) {
    if (isMissingModuleError(error) && optional) {
      return null
    }

    throw error
  }
}
