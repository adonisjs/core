/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import number from '@poppinss/utils/number'

/**
 * Collection of number helpers to clamp, parse, and convert numeric values.
 * This object re-exports the base number utilities from @poppinss/utils.
 *
 * @example
 * // Constrain and inspect values
 * numberHelpers.clamp(15, 0, 10)  // 10
 * numberHelpers.between(5, 0, 10) // true
 *
 * @example
 * // Parse untrusted input
 * numberHelpers.parse('42')        // 42
 * numberHelpers.toFinite('abc', 0) // 0
 */
const numberHelpers: typeof number = {
  ...number,
}

export default numberHelpers
