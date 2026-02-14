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
export const E_BLIND_INDEX_NOT_SUPPORTED = createError<[string]>(
  'Blind indexes are not supported by the "%s" encryption driver',
  'E_BLIND_INDEX_NOT_SUPPORTED'
)

/**
 * Encryption errors exposed by this package.
 */
export const errors = {
  ...boringnodeErrors,
  E_BLIND_INDEX_NOT_SUPPORTED,
}
