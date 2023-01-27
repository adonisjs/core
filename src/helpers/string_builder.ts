/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname } from 'node:path'
import string from './string.js'

/**
 * String builder to transform the string using the fluent API
 */
export class StringBuilder {
  #value: string

  constructor(value: string | StringBuilder) {
    this.#value = typeof value === 'string' ? value : value.toString()
  }

  /**
   * Applies dash case transformation
   */
  dashCase(): this {
    this.#value = string.dashCase(this.#value)
    return this
  }

  /**
   * Applies dot case transformation
   */
  dotCase(): this {
    this.#value = string.dotCase(this.#value)
    return this
  }

  /**
   * Applies snake case transformation
   */
  snakeCase(): this {
    this.#value = string.snakeCase(this.#value)
    return this
  }

  /**
   * Applies pascal case transformation
   */
  pascalCase(): this {
    this.#value = string.pascalCase(this.#value)
    return this
  }

  /**
   * Applies camelcase case transformation
   */
  camelCase(): this {
    this.#value = string.camelCase(this.#value)
    return this
  }

  /**
   * Applies capital case transformation
   */
  capitalCase(): this {
    this.#value = string.capitalCase(this.#value)
    return this
  }

  /**
   * Applies title case transformation
   */
  titleCase(): this {
    this.#value = string.titleCase(this.#value)
    return this
  }

  /**
   * Applies sentence case transformation
   */
  sentenceCase(): this {
    this.#value = string.sentenceCase(this.#value)
    return this
  }

  /**
   * Removes all sorts of casing from the string
   */
  noCase(): this {
    this.#value = string.noCase(this.#value)
    return this
  }

  /**
   * Converts value to its plural form
   */
  plural(): this {
    this.#value = string.pluralize(this.#value)
    return this
  }

  /**
   * Converts value to its singular form
   */
  singular(): this {
    this.#value = string.singular(this.#value)
    return this
  }

  /**
   * Converts value to a URL friendly slug
   */
  slugify(): this {
    this.#value = string.slug(this.#value)
    return this
  }

  /**
   * Removes a given suffix from the string
   */
  removeSuffix(suffix: string): this {
    this.#value = this.#value.replace(new RegExp(`[-_]?${suffix}$`, 'i'), '')
    return this
  }

  /**
   * Adds suffix to the string
   */
  suffix(suffix: string): this {
    this.removeSuffix(suffix)
    this.#value = `${this.#value}${suffix}`
    return this
  }

  /**
   * Removes a given prefix from the string
   */
  removePrefix(prefix: string): this {
    this.#value = this.#value.replace(new RegExp(`^${prefix}[-_]?`, 'i'), '')
    return this
  }

  /**
   * Adds prefix to the string
   */
  prefix(prefix: string): this {
    this.removePrefix(prefix)
    this.#value = `${prefix}${this.#value}`
    return this
  }

  /**
   * Removes extension from the value
   */
  removeExtension(): this {
    this.#value = this.#value.replace(new RegExp(`${extname(this.#value)}$`), '')
    return this
  }

  /**
   * Adds extension to the value
   */
  ext(extension: string): this {
    this.removeExtension()
    this.#value = `${this.#value}.${extension.replace(/^\./, '')}`
    return this
  }

  toString() {
    return this.#value
  }
}
