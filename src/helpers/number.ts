/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Collection of number helpers to clamp, parse, and format numeric values.
 *
 * @example
 * // Constrain and inspect values
 * numberHelpers.clamp(15, 0, 10)   // 10
 * numberHelpers.between(5, 0, 10)  // true
 *
 * @example
 * // Parse untrusted input and format output
 * numberHelpers.parse('42')                       // 42
 * numberHelpers.toFinite('abc', 0)                // 0
 * numberHelpers.format(1500, { compact: true })   // '1.5K'
 */
const numberHelpers = {
  /**
   * Constrain a number to stay within the given bounds.
   *
   * @param value - The number to constrain
   * @param min - The lower bound
   * @param max - The upper bound
   *
   * @example
   * numberHelpers.clamp(15, 0, 10) // 10
   * numberHelpers.clamp(-2, 0, 10) // 0
   * numberHelpers.clamp(5, 0, 10)  // 5
   */
  clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min
    } else if (value > max) {
      return max
    } else {
      return value
    }
  },

  /**
   * Check if a number is inside an inclusive range. The bounds may be
   * passed in either order.
   *
   * @param value - The number to test
   * @param min - One end of the range
   * @param max - The other end of the range
   *
   * @example
   * numberHelpers.between(5, 0, 10)  // true
   * numberHelpers.between(0, 0, 10)  // true
   * numberHelpers.between(11, 0, 10) // false
   * numberHelpers.between(5, 10, 0)  // true
   */
  between(value: number, min: number, max: number): boolean {
    const lo = Math.min(min, max)
    const hi = Math.max(min, max)
    return value >= lo && value <= hi
  },

  /**
   * Convert a value to a finite number. Returns the fallback when the
   * result is `NaN` or `Infinity`.
   *
   * @param value - The value to convert
   * @param fallback - Value to return when conversion fails. Defaults to `0`
   *
   * @example
   * numberHelpers.toFinite(5)                         // 5
   * numberHelpers.toFinite('42')                      // 42
   * numberHelpers.toFinite(Number.NaN)               // 0
   * numberHelpers.toFinite(Number.POSITIVE_INFINITY)  // 0
   * numberHelpers.toFinite('abc', 10)                 // 10
   */
  toFinite(value: unknown, fallback = 0): number {
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : fallback
  },

  /**
   * Parse a value into a finite number. Returns `null` for empty input,
   * `NaN`, and `Infinity` instead of substituting a fallback.
   *
   * @param value - The value to parse
   *
   * @example
   * numberHelpers.parse(5)                        // 5
   * numberHelpers.parse('42')                      // 42
   * numberHelpers.parse('')                        // null
   * numberHelpers.parse(null)                     // null
   * numberHelpers.parse(Number.NaN)               // null
   * numberHelpers.parse(Number.POSITIVE_INFINITY)  // null
   */
  parse(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : null
  },

  /**
   * Format a number using `Intl.NumberFormat`.
   *
   * @param value - The number to format
   * @param options - Formatting options
   * @param options.digits - Maximum fraction digits. Defaults to `2`
   * @param options.compact - Use compact notation (e.g. `1.5K`)
   *
   * @example
   * numberHelpers.format(12.3456)                      // '12.35'
   * numberHelpers.format(12.3456, { digits: 1 })        // '12.3'
   * numberHelpers.format(1500, { compact: true })       // '1.5K'
   */
  format(value: number, options?: { digits?: number; compact?: boolean }): string {
    return new Intl.NumberFormat('en', {
      maximumFractionDigits: options?.digits ?? 2,
      notation: options?.compact ? 'compact' : 'standard',
    }).format(value)
  },
}

export default numberHelpers

