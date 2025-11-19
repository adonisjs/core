/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createHmac } from 'node:crypto'
import { safeEqual } from '@poppinss/utils'
import base64 from '@poppinss/utils/base64'

/**
 * A generic class for generating SHA-256 Hmac for verifying the value
 * integrity.
 */
export class Hmac {
  #key: Buffer

  constructor(key: Buffer) {
    this.#key = key
  }

  /**
   * Generate the hmac
   */
  generate(value: string) {
    return base64.urlEncode(createHmac('sha256', this.#key).update(value).digest())
  }

  /**
   * Compare raw value against an existing hmac
   */
  compare(value: string, existingHmac: string) {
    return safeEqual(this.generate(value), existingHmac)
  }
}
