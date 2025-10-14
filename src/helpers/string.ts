/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import prettyHrTime from 'pretty-hrtime'
import string from '@poppinss/utils/string'
import he, { type EncodeOptions } from 'he'
import StringBuilder from '@poppinss/utils/string_builder'

/**
 * Collection of string helpers to transform a string value. This object extends
 * the base string utilities from @poppinss/utils with additional AdonisJS-specific
 * string manipulation methods.
 *
 * @example
 * // Basic string transformations
 * stringHelpers.camelCase('hello_world') // 'helloWorld'
 * stringHelpers.snakeCase('HelloWorld')   // 'hello_world'
 * stringHelpers.pascalCase('hello world') // 'HelloWorld'
 *
 * @example
 * // HTML escaping and encoding
 * stringHelpers.escapeHTML('<script>alert("xss")</script>')
 * stringHelpers.encodeSymbols('© 2023 AdonisJS')
 */
const stringHelpers: typeof string & {
  /**
   * Creates an instance of the StringBuilder for efficient string concatenation.
   *
   * @param value - Initial string value or existing StringBuilder instance
   *
   * @example
   * const builder = stringHelpers.create('Hello')
   * builder.append(' ').append('World')
   * console.log(builder.toString()) // 'Hello World'
   */
  create(value: string | StringBuilder): StringBuilder

  /**
   * Convert a number to its ordinal form (1st, 2nd, 3rd, etc.).
   * Alias for the `ordinal` method from @poppinss/utils.
   *
   * @example
   * stringHelpers.ordinalize(1)  // '1st'
   * stringHelpers.ordinalize(22) // '22nd'
   */
  ordinalize: (typeof string)['ordinal']

  /**
   * Convert a string to a readable sentence format.
   * Alias for the `sentence` method from @poppinss/utils.
   *
   * @example
   * stringHelpers.toSentence('hello_world') // 'Hello world'
   * stringHelpers.toSentence('firstName')   // 'First name'
   */
  toSentence: (typeof string)['sentence']

  /**
   * Generate a cryptographically secure random string of specified length.
   * Alias for the `random` method from @poppinss/utils.
   *
   * @example
   * stringHelpers.generateRandom(16) // 'a1b2c3d4e5f6g7h8'
   * stringHelpers.generateRandom(32) // Long random string
   */
  generateRandom: (typeof string)['random']

  /**
   * Convert high-resolution time difference to a human-readable format.
   *
   * @param time - High-resolution time tuple from process.hrtime()
   * @param options - Formatting options
   * @param options.verbose - Use verbose format (e.g., '1 second' vs '1s')
   * @param options.precise - Show precise decimal places
   *
   * @example
   * const start = process.hrtime()
   * // ... some operation
   * const diff = process.hrtime(start)
   * stringHelpers.prettyHrTime(diff) // '2.5ms'
   * stringHelpers.prettyHrTime(diff, { verbose: true }) // '2 milliseconds'
   */
  prettyHrTime(
    time: [number, number],
    options?: { verbose?: boolean | undefined; precise?: boolean | undefined }
  ): string

  /**
   * Check if a string is empty or contains only whitespace characters.
   *
   * @param value - The string to check
   *
   * @example
   * stringHelpers.isEmpty('')      // true
   * stringHelpers.isEmpty('   ')   // true
   * stringHelpers.isEmpty('hello') // false
   */
  isEmpty(value: string): boolean

  /**
   * Escape HTML entities to prevent XSS attacks and display HTML safely.
   *
   * @param value - The string to escape
   * @param options - Escaping options
   * @param options.encodeSymbols - Whether to encode symbols as HTML entities
   *
   * @example
   * stringHelpers.escapeHTML('<script>alert("xss")</script>')
   * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
   *
   * @example
   * stringHelpers.escapeHTML('© 2023', { encodeSymbols: true })
   * // '&copy; 2023'
   */
  escapeHTML(value: string, options?: { encodeSymbols?: boolean }): string

  /**
   * Encode Unicode symbols and special characters as HTML entities.
   *
   * @param value - The string containing symbols to encode
   * @param options - Encoding options from the 'he' library
   *
   * @example
   * stringHelpers.encodeSymbols('© 2023 AdonisJS ™')
   * // '&copy; 2023 AdonisJS &trade;'
   *
   * @example
   * stringHelpers.encodeSymbols('Café', { decimal: true })
   * // 'Caf&#233;'
   */
  encodeSymbols(value: string, options?: EncodeOptions): string
} = {
  ...string,
  toSentence: string.sentence,
  ordinalize: string.ordinal,
  generateRandom: string.random,

  create(value: string | StringBuilder): StringBuilder {
    return new StringBuilder(value)
  },

  /**
   * Formats Node.js hrtime output into a human-readable string.
   *
   * @param time - Tuple of [seconds, nanoseconds] from process.hrtime()
   * @param options - Formatting options for output style and precision
   */
  prettyHrTime(time, options) {
    return prettyHrTime(time, options)
  },

  /**
   * Check if a string is empty or contains only whitespace characters.
   * 
   * @param value - The string to check for emptiness
   */
  isEmpty(value: string): boolean {
    return value.trim().length === 0
  },

  /**
   * Escape HTML entities to prevent XSS attacks and display HTML safely.
   * 
   * @param value - The string containing HTML to escape
   * @param options - Optional configuration for escaping behavior
   * @param options.encodeSymbols - Whether to also encode Unicode symbols as HTML entities
   */
  escapeHTML(value: string, options?: { encodeSymbols?: boolean }): string {
    value = he.escape(value)
    if (options && options.encodeSymbols) {
      value = this.encodeSymbols(value, { allowUnsafeSymbols: true })
    }
    return value
  },

  /**
   * Encode Unicode symbols and special characters as HTML entities.
   * 
   * @param value - The string containing symbols to encode
   * @param options - Encoding options from the 'he' library
   */
  encodeSymbols(value: string, options?: EncodeOptions): string {
    return he.encode(value, options)
  },
}

export default stringHelpers
