/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createHash } from 'node:crypto'
import base64 from '@poppinss/utils/base64'
import { MessageBuilder } from '@poppinss/utils'
import { RuntimeException } from '@poppinss/utils/exception'
import { Hmac } from './hmac.ts'

/**
 * Message verifier is similar to the encryption. However, the actual payload
 * is not encrypted and just base64 encoded. This is helpful when you are
 * not concerned about the confidentiality of the data, but just want to
 * make sure that is not tampered with after encoding.
 */
export class MessageVerifier {
  /**
   * The key for signing and encrypting values. It is derived
   * from the user provided secret.
   */
  #cryptoKey: Buffer

  /**
   * Use `dot` as a separator for joining encrypted value, iv and the
   * hmac hash. The idea is borrowed from JWT's in which each part
   * of the payload is concatenated with a dot.
   */
  #separator = '.'

  constructor(secret: string) {
    this.#cryptoKey = createHash('sha256').update(secret).digest()
  }

  /**
   * Sign a given piece of value using the app secret. A wide range of
   * data types are supported.
   *
   * - String
   * - Arrays
   * - Objects
   * - Booleans
   * - Numbers
   * - Dates
   *
   * You can optionally define a purpose for which the value was signed and
   * mentioning a different purpose/no purpose during unsign will fail.
   */
  sign(payload: any, expiresIn?: string | number, purpose?: string) {
    if (payload === null || payload === undefined) {
      throw new RuntimeException(`Cannot sign "${payload}" value`)
    }

    const encoded = base64.urlEncode(new MessageBuilder().build(payload, expiresIn, purpose))
    return `${encoded}${this.#separator}${new Hmac(this.#cryptoKey).generate(encoded)}`
  }

  /**
   * Unsign a previously signed value with an optional purpose
   */
  unsign<T extends any>(payload: string, purpose?: string): T | null {
    if (typeof payload !== 'string') {
      return null
    }

    /**
     * Ensure value is in correct format
     */
    const [encoded, hash] = payload.split(this.#separator)
    if (!encoded || !hash) {
      return null
    }

    /**
     * Ensure value can be decoded
     */
    const decoded = base64.urlDecode(encoded, 'utf8')
    if (!decoded) {
      return null
    }

    const isValid = new Hmac(this.#cryptoKey).compare(encoded, hash)
    return isValid ? new MessageBuilder().verify(decoded, purpose) : null
  }
}
