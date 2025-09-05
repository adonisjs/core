/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Assertion utilities for type-safe programming in AdonisJS. These functions
 * provide runtime type assertions that help with TypeScript type narrowing
 * and catching potential null/undefined issues early.
 *
 * @example
 * // Type-safe null checking
 * import { assertExists } from '@adonisjs/core/helpers'
 * 
 * function processUser(user: User | null) {
 *   assertExists(user) // TypeScript now knows user is not null
 *   console.log(user.name) // Safe to access properties
 * }
 *
 * @example
 * // Exhaustiveness checking in switch statements
 * import { assertUnreachable } from '@adonisjs/core/helpers'
 * 
 * function handleStatus(status: 'pending' | 'completed') {
 *   switch (status) {
 *     case 'pending': return 'Processing...'
 *     case 'completed': return 'Done!'
 *     default: return assertUnreachable(status)
 *   }
 * }
 */
export {
  /**
   * Assert that a value exists (is not null or undefined).
   * Throws an error if the value is null or undefined.
   */
  assertExists,

  /**
   * Assert that a value is not null.
   * Throws an error if the value is null.
   */
  assertNotNull,

  /**
   * Assert that a value is defined (is not undefined).
   * Throws an error if the value is undefined.
   */
  assertIsDefined,

  /**
   * Assert that code should never reach this point.
   * Useful for exhaustiveness checking in switch statements.
   */
  assertUnreachable,
} from '@poppinss/utils/assert'
