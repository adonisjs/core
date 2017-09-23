'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Encryptor = require('simple-encryptor')
const GE = require('@adonisjs/generic-exceptions')

/**
 * This class is used to encrypt/decrypt values using a secure
 * key and also base64 `encode` and `decode` strings.
 *
 * @binding Adonis/Src/Encryption
 * @alias Encryption
 * @group Core
 * @singleton
 *
 * @class Encryption
 * @constructor
 */
class Encryption {
  constructor (Config) {
    const appKey = Config.get('app.appKey')

    /**
     * Throw exception when app key doesn't exists.
     */
    if (!appKey) {
      throw GE.RuntimeException.missingAppKey('Encryption')
    }

    this.encryptor = Encryptor(appKey)
  }

  /**
   * Encrypt a string, number or an object
   *
   * @method encrypt
   *
   * @param  {Mixed} input
   *
   * @return {String}
   *
   * @example
   * ```js
   * Encryption.encrypt('hello world')
   * Encryption.encrypt({ name: 'virk' })
   * ```
   */
  encrypt (input) {
    return this.encryptor.encrypt(input)
  }

  /**
   * Decrypt encoded string
   *
   * @method decrypt
   *
   * @param  {String} cipherText
   *
   * @return {Mixed}
   *
   * @example
   * ```js
   * Encryption.decrypt(encryptedValue)
   * ```
   */
  decrypt (cipherText) {
    return this.encryptor.decrypt(cipherText)
  }

  /**
   * Base64 encode a string
   *
   * @method base64Encode
   *
   * @param  {String}     input
   *
   * @return {String}
   *
   * @example
   * ```js
   * Encryption.base64Encode('hello world')
   * ```
   */
  base64Encode (input) {
    return Buffer.from(input).toString('base64')
  }

  /**
   * Decode a previously encoded base64 string or buffer
   *
   * @method base64Decode
   *
   * @param  {String|Buffer}     encodedText
   *
   * @return {String}
   *
   * @example
   * ```js
   * Encryption.base64Decode(encodedValue)
   * ```
   */
  base64Decode (encodedText) {
    const buff = Buffer.isBuffer(encodedText) ? encodedText : Buffer.from(encodedText, 'base64')
    return buff.toString('utf8')
  }
}

module.exports = Encryption
