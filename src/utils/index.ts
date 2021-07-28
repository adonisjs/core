/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { promisify } from 'util'
import { pipeline } from 'stream'
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

/**
 * Convert windows path to unix.
 * Copied from https://github.com/sindresorhus/slash as the package is ESM only
 */
export function slash(filePath: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(filePath)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(filePath) // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return filePath
  }

  return filePath.replace(/\\/g, '/')
}

export const pipelinePromise = promisify(pipeline)
