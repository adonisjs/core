/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createError } from '../../src/exceptions.ts'
import { errors as boringnodeErrors } from '@boringnode/encryption'

/**
 * Raised when attempting to compute blind indexes using the legacy driver.
 */
export const E_LEGACY_BLIND_INDEX_NOT_SUPPORTED = createError(
  'Blind indexes are not supported by the legacy encryption driver',
  'E_LEGACY_BLIND_INDEX_NOT_SUPPORTED'
)

/**
 * Encryption errors exposed by this package.
 */
export const errors = {
  ...boringnodeErrors,
  E_LEGACY_BLIND_INDEX_NOT_SUPPORTED,
}
