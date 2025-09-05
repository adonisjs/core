/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Core exception classes and utilities for AdonisJS. This module re-exports
 * commonly used exception classes from @poppinss/utils for creating and
 * handling errors in AdonisJS applications.
 *
 * @example
 * // Creating a custom exception
 * import { Exception } from '@adonisjs/core/exceptions'
 *
 * class ValidationException extends Exception {
 *   static status = 422
 *   static code = 'E_VALIDATION_FAILURE'
 * }
 *
 * @example
 * // Using createError to create custom error classes
 * import { createError } from '@adonisjs/core/exceptions'
 *
 * const UserNotFound = createError('User not found', 'E_USER_NOT_FOUND', 404)
 * throw new UserNotFound()
 */
export {
  /**
   * Base exception class for creating custom exceptions with status codes,
   * error codes, and additional context.
   */
  Exception,

  /**
   * Utility function to create custom error classes with predefined
   * message, code, and status.
   */
  createError,

  /**
   * Runtime exception class for errors that occur during application runtime.
   */
  RuntimeException,

  /**
   * Exception class for invalid argument errors, typically used in function
   * parameter validation.
   */
  InvalidArgumentsException,
} from '@poppinss/utils/exception'
