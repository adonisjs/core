/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { errors } from '@boringnode/encryption'
import { MessageBuilder, type Secret } from '@poppinss/utils'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import { BaseDriver, Hmac, base64UrlDecode, base64UrlEncode } from '@boringnode/encryption'
import type {
  CypherText,
  EncryptOptions,
  EncryptionDriverContract,
} from '@boringnode/encryption/types'
import { E_BLIND_INDEX_NOT_SUPPORTED } from '../errors.ts'

/**
 * Configuration for the Legacy encryption driver.
 *
 * The Legacy driver maintains compatibility with the old AdonisJS v6
 * encryption format using AES-256-CBC with HMAC SHA-256.
 */
export interface LegacyConfig {
  key: string | Secret<string>
}

/**
 * Configuration for the Legacy encryption driver factory.
 *
 * Used when configuring the driver through the defineConfig function.
 */
export interface LegacyDriverConfig {
  keys: (string | Secret<string>)[]
}

/**
 * Factory function to create a Legacy encryption configuration.
 *
 * @example
 * ```ts
 * drivers.legacy({
 *   keys: [env.get('APP_KEY')]
 * })
 * ```
 */
export function legacy(config: LegacyDriverConfig) {
  return {
    driver: (key: string | Secret<string>) => new Legacy({ key }),
    keys: config.keys,
  }
}

/**
 * Legacy encryption driver for AdonisJS.
 *
 * This driver maintains compatibility with the old AdonisJS v6 encryption
 * format. It uses:
 * - AES-256-CBC for encryption
 * - HMAC SHA-256 for integrity verification
 * - MessageBuilder from @poppinss/utils for encoding values
 *
 * Encrypted format: `[encrypted_base64url].[iv_base64url].[hmac]`
 *
 * @example
 * ```ts
 * const driver = new Legacy({ key: 'your-32-character-secret-key!!' })
 *
 * const encrypted = driver.encrypt('sensitive data')
 * const decrypted = driver.decrypt(encrypted)
 * ```
 */
export class Legacy extends BaseDriver implements EncryptionDriverContract {
  constructor(config: LegacyConfig) {
    super(config)

    /**
     * The key length must be at least 16 characters
     */
    if (this.cryptoKey.length < 16) {
      throw new errors.E_INSECURE_ENCRYPTER_KEY()
    }
  }

  /**
   * Encrypt a given piece of value using the app secret. A wide range of
   * data types are supported.
   *
   * - String
   * - Arrays
   * - Objects
   * - Booleans
   * - Numbers
   * - Dates
   *
   * You can optionally define a purpose for which the value was encrypted and
   * mentioning a different purpose/no purpose during decrypt will fail.
   */
  encrypt(payload: any, options?: EncryptOptions): CypherText
  encrypt(payload: any, expiresIn?: string | number, purpose?: string): CypherText
  encrypt(
    payload: any,
    expiresInOrOptions?: string | number | EncryptOptions,
    purpose?: string
  ): CypherText {
    let expiresIn: string | number | undefined
    let actualPurpose: string | undefined

    if (typeof expiresInOrOptions === 'object' && expiresInOrOptions !== null) {
      expiresIn = expiresInOrOptions.expiresIn
      actualPurpose = expiresInOrOptions.purpose
    } else {
      expiresIn = expiresInOrOptions
      actualPurpose = purpose
    }

    /**
     * The IV is a random 16-character string (not raw bytes). The old
     * AdonisJS v6 "@adonisjs/encryption" implementation generates the IV
     * via `string.random(16)` and treats it as a utf-8 string throughout
     * its encrypt/decrypt pipeline. We must mirror that exactly, otherwise
     * values encrypted here cannot be decrypted by the old encrypter.
     */
    const iv = string.random(16)

    /**
     * Use the first 32 bytes of the key for AES-256
     */
    const encryptionKey = this.cryptoKey.subarray(0, 32)

    const cipher = createCipheriv('aes-256-cbc', encryptionKey, iv)
    const plainText = new MessageBuilder().build(payload, expiresIn, actualPurpose)
    const cipherText = Buffer.concat([cipher.update(plainText), cipher.final()])

    const macPayload = `${base64UrlEncode(cipherText)}${this.separator}${base64UrlEncode(iv)}`
    const hmac = new Hmac(this.cryptoKey).generate(macPayload)

    return this.computeReturns([macPayload, hmac])
  }

  /**
   * Decrypt value and verify it against a purpose
   */
  decrypt<T extends any>(value: string, purpose?: string): T | null {
    if (typeof value !== 'string') {
      return null
    }

    const [cipherEncoded, ivEncoded, macEncoded] = value.split(this.separator)

    if (!cipherEncoded || !ivEncoded || !macEncoded) {
      return null
    }

    const cipherText = base64UrlDecode(cipherEncoded)
    if (!cipherText) {
      return null
    }

    const iv = base64UrlDecode(ivEncoded)
    if (!iv) {
      return null
    }

    /**
     * Verify the HMAC
     */
    const isValidHmac = new Hmac(this.cryptoKey).compare(
      `${cipherEncoded}${this.separator}${ivEncoded}`,
      macEncoded
    )

    if (!isValidHmac) {
      return null
    }

    try {
      /**
       * Use the first 32 bytes of the key for AES-256
       */
      const encryptionKey = this.cryptoKey.subarray(0, 32)

      const decipher = createDecipheriv('aes-256-cbc', encryptionKey, iv)
      const plainTextBuffer = Buffer.concat([decipher.update(cipherText), decipher.final()])

      return new MessageBuilder().verify<T>(plainTextBuffer, purpose)
    } catch {
      return null
    }
  }

  /**
   * Legacy driver does not support blind indexes.
   */
  blindIndex(_payload: any, _purpose: string): string {
    throw new E_BLIND_INDEX_NOT_SUPPORTED(['legacy'])
  }

  /**
   * Legacy driver does not support blind indexes.
   */
  blindIndexes(_payload: any, _purpose: string): string[] {
    throw new E_BLIND_INDEX_NOT_SUPPORTED(['legacy'])
  }
}
