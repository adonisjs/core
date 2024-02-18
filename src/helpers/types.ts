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
 * Use "is" helpers instead. The types helpers exists
 * for backward compatibility
 */
const types = {
  lookup: is,
  isNull: is.null,
  isBoolean: is.boolean,
  isBuffer: is.buffer,
  isNumber: is.number,
  isString: is.string,
  isArguments: is.arguments,
  isObject: is.object,
  isDate: is.date,
  isArray: is.array,
  isRegexp: is.regExp,
  isError: is.error,
  isFunction: is.function,
  isClass: is.class,
  isInteger: is.integer,
  isFloat(value: number): value is number {
    return value !== (value | 0)
  },
  isDecimal(value: string | number, options?: { decimalPlaces?: string }): boolean {
    if (typeof value === 'number') {
      value = value.toString()
    }

    const decimalPlaces = (options && options.decimalPlaces) || '1,'
    return new RegExp(`^[-+]?([0-9]+)?(\\.[0-9]{${decimalPlaces}})$`).test(value)
  },
}

export default types
