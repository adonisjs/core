/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import is from '@sindresorhus/is'

/**
 * Type checking utilities re-exported from @sindresorhus/is. Provides
 * a comprehensive set of type-checking functions with TypeScript type guards.
 *
 * @example
 * // Basic type checking
 * import { is } from '@adonisjs/core/helpers'
 *
 * if (is.string(value)) {
 *   // TypeScript knows value is string
 *   console.log(value.toUpperCase())
 * }
 *
 * @example
 * // Complex type checking
 * import { is } from '@adonisjs/core/helpers'
 *
 * is.array(value) && is.nonEmptyArray(value)
 * is.plainObject(obj) && is.hasProperty(obj, 'name')
 * is.number(num) && is.integer(num) && is.positive(num)
 */
export default is
