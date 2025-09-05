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
 * @deprecated
 * Use "is" helpers instead. The types helpers exist for backward compatibility.
 * 
 * @example
 * // Instead of using types helpers (deprecated)
 * types.isString('hello')
 * types.isNumber(42)
 * 
 * @example
 * // Use the new "is" helpers
 * import { is } from '@adonisjs/core/helpers'
 * is.string('hello')
 * is.number(42)
 */
const types = {
  /**
   * Direct reference to the is utility for type checking lookups.
   * @deprecated Use the is helpers directly instead
   */
  lookup: is,

  /**
   * Check if value is null.
   * @deprecated Use is.null instead
   */
  isNull: is.null,

  /**
   * Check if value is a boolean.
   * @deprecated Use is.boolean instead
   */
  isBoolean: is.boolean,

  /**
   * Check if value is a Buffer.
   * @deprecated Use is.buffer instead
   */
  isBuffer: is.buffer,

  /**
   * Check if value is a number.
   * @deprecated Use is.number instead
   */
  isNumber: is.number,

  /**
   * Check if value is a string.
   * @deprecated Use is.string instead
   */
  isString: is.string,

  /**
   * Check if value is an arguments object.
   * @deprecated Use is.arguments instead
   */
  isArguments: is.arguments,

  /**
   * Check if value is an object.
   * @deprecated Use is.object instead
   */
  isObject: is.object,

  /**
   * Check if value is a Date.
   * @deprecated Use is.date instead
   */
  isDate: is.date,

  /**
   * Check if value is an array.
   * @deprecated Use is.array instead
   */
  isArray: is.array,

  /**
   * Check if value is a regular expression.
   * @deprecated Use is.regExp instead
   */
  isRegexp: is.regExp,

  /**
   * Check if value is an error object.
   * @deprecated Use is.error instead
   */
  isError: is.error,

  /**
   * Check if value is a function.
   * @deprecated Use is.function instead
   */
  isFunction: is.function,

  /**
   * Check if value is a class.
   * @deprecated Use is.class instead
   */
  isClass: is.class,

  /**
   * Check if value is an integer.
   * @deprecated Use is.integer instead
   */
  isInteger: is.integer,

  /**
   * Check if a number is a float (has decimal places).
   * 
   * @param value - The number to check
   * @deprecated Use is.decimal or custom logic instead
   * 
   * @example
   * types.isFloat(3.14) // true
   * types.isFloat(42)   // false
   */
  isFloat(value: number): value is number {
    return value !== (value | 0)
  },

  /**
   * Check if a value represents a decimal number with specific decimal places.
   * 
   * @param value - The value to check (string or number)
   * @param options - Options for decimal validation
   * @param options.decimalPlaces - Regex pattern for allowed decimal places (default: '1,')
   * @deprecated Use a validation library like Vine or custom logic instead
   * 
   * @example
   * types.isDecimal('3.14')     // true
   * types.isDecimal('42.0')     // true  
   * types.isDecimal('42')       // false
   * types.isDecimal('3.141', { decimalPlaces: '1,3' }) // true
   */
  isDecimal(value: string | number, options?: { decimalPlaces?: string }): boolean {
    if (typeof value === 'number') {
      value = value.toString()
    }

    const decimalPlaces = (options && options.decimalPlaces) || '1,'
    return new RegExp(`^[-+]?([0-9]+)?(\\.[0-9]{${decimalPlaces}})$`).test(value)
  },
}

export default types
