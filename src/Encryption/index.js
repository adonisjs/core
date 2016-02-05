'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const crypto = require('crypto')

/**
 * Encrypt and decrypt values using nodeJs crypto, make
 * sure to set APP_KEY inside .env file.
 * @class
 */
class Encryption {

  constructor (Config) {
    this.appKey = Config.get('app.appKey')
    this.algorithm = Config.get('app.encryption.algorithm', 'aes-256-cbc')

    /**
     * throwing error when APP_KEY is not defined as encryption
     * does not make sense without a key
     */
    if (!this.appKey) {
      throw new Error('Encryption cannot work without application key. Define appKey inside app config')
    }
  }

  /**
   * encrypts a given value
   *
   * @param  {Mixed} value - value to be encrypted
   * @param  {String} [encoding=utf8] encoding to be used for input value
   * @return {String}
   *
   * @example
   * Encryption.encrypt('somevalue')
   *
   * @public
   */
  encrypt (value, encoding) {
    const cipher = crypto.createCipher(this.algorithm, this.appKey)
    encoding = encoding || 'utf8'
    cipher.update(value, encoding, 'hex')
    return cipher.final('hex')
  }

  /**
   * decrypts encrypted value
   *
   * @param  {String} value - value to decrypt
   * @param  {String} [encoding=utf8] encoding to be used for output value
   * @return {Mixed}
   *
   * @example
   * Encryption.decrypt('somevalue')
   *
   * @public
   */
  decrypt (value, encoding) {
    const decipher = crypto.createDecipher(this.algorithm, this.appKey)
    encoding = encoding || 'utf8'
    decipher.update(value, 'hex', encoding)
    return decipher.final(encoding)
  }

}

module.exports = Encryption
