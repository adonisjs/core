/**
 * @module Core
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
*/

import encryptorCreator, { SimpleEncryptor } from 'simple-encryptor'
import GE from '@adonisjs/generic-exceptions'

/**
 * This class is used to encrypt/decrypt values using a secure
 * key and also base64 `encode` and `decode` strings.
 */
class Encryption {
  /**
   * Application key used to encrypt data.
   */
  public appKey: string

  /**
   * Options used to configure the encrypter.
   */
  public options: Object

  /**
   * Instance of the encryptor.
   */
  public encryptor: SimpleEncryptor

  /**
   * Constructor.
   *
   * @param  appKey   Application key used to encrypt data
   * @param  options  Options used to configure the encrypter
   */
  constructor (appKey: string, options: Object) {
    /**
     * Throw exception when app key doesn't exists.
     */
    if (!appKey) {
      throw GE.RuntimeException.missingAppKey('Encryption')
    }

    this.appKey = appKey
    this.encryptor = encryptorCreator(Object.assign({ key: appKey }, options))
  }

  /**
   * Returns a new instance of encrypter with different options.
   *
   * @param  options  Options used to create the new instance
   */
  public getInstance (options: Object): Encryption {
    return new Encryption(this.appKey, options)
  }

  /**
   * Encrypt a string, number or an object
   *
   * @param  input  Input to encrypt
   *
   * @example
   * ```js
   * Encryption.encrypt('hello world')
   * Encryption.encrypt({ name: 'virk' })
   * ```
   */
  public encrypt (input: string | number): string {
    return this.encryptor.encrypt(input)
  }

  /**
   * Decrypt encoded string.
   *
   * @param  cipherText  Text to decrypt
   *
   * @example
   * ```js
   * Encryption.decrypt(encryptedValue)
   * ```
   */
  public decrypt (cipherText: string): string | number | null {
    return this.encryptor.decrypt(cipherText)
  }

  /**
   * Base64 encode a string
   *
   * @param  input  Input to encore with Base64 algorithm
   *
   * @example
   * ```js
   * Encryption.base64Encode('hello world')
   * ```
   */
  public base64Encode (input: string): string {
    return Buffer.from(input).toString('base64')
  }

  /**
   * Decode a previously encoded base64 string or buffer
   *
   * @param encodedText  Text to decode with Base64 algorithm
   *
   * @example
   * ```js
   * Encryption.base64Decode(encodedValue)
   * ```
   */
  public base64Decode (encodedText: string): string {
    const buff = Buffer.isBuffer(encodedText) ? encodedText : Buffer.from(encodedText, 'base64')
    return buff.toString('utf8')
  }
}

export { Encryption }
