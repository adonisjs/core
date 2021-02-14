/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { resolveFrom } from '@poppinss/utils/build/helpers'

/**
 * Helper to know if error belongs to a missing module
 * error
 */
export function isMissingModuleError(error: NodeJS.ErrnoException) {
  return ['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code!)
}

/**
 * Registers the ts hook to compile typescript code within the memory
 */
export function registerTsHook(appRoot: string) {
  try {
    require(resolveFrom(appRoot, '@adonisjs/assembler/build/src/requireHook')).default(appRoot)
  } catch (error) {
    if (isMissingModuleError(error)) {
      throw new Error(
        'AdonisJS requires "@adonisjs/assembler" in order to run typescript source directly'
      )
    }

    throw error
  }
}
