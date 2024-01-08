/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import he, { EncodeOptions } from 'he'
import prettyHrTime from 'pretty-hrtime'
import string from '@poppinss/utils/string'
import StringBuilder from '@poppinss/utils/string_builder'

/**
 * Collection of string helpers to transform a string value.
 */
const stringHelpers: typeof string & {
  /**
   * Creates an instance of the string builder
   */
  create(value: string | StringBuilder): StringBuilder

  ordinalize: (typeof string)['ordinal']

  /**
   * Convert a string to a sentence
   */
  toSentence: (typeof string)['sentence']

  /**
   * Generate a random string value of a given length
   */
  generateRandom: (typeof string)['random']

  /**
   * Pretty print hrtime diff
   */
  prettyHrTime(
    time: [number, number],
    options?: { verbose?: boolean | undefined; precise?: boolean | undefined }
  ): string

  /**
   * Check if a string is empty.
   */
  isEmpty(value: string): boolean

  /**
   * Escape HTML entities
   */
  escapeHTML(value: string, options?: { encodeSymbols?: boolean }): string

  /**
   * Encode symbols to html entities
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

  prettyHrTime(time, options) {
    return prettyHrTime(time, options)
  },

  isEmpty(value: string): boolean {
    return value.trim().length === 0
  },

  escapeHTML(value: string, options?: { encodeSymbols?: boolean }): string {
    value = he.escape(value)
    if (options && options.encodeSymbols) {
      value = this.encodeSymbols(value, { allowUnsafeSymbols: true })
    }
    return value
  },

  encodeSymbols(value: string, options?: EncodeOptions): string {
    return he.encode(value, options)
  },
}

export default stringHelpers
