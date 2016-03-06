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
    encoding = encoding || 'utf8'

    let iv = crypto.randomBytes(this.getIvSize())

    let cipher = crypto.createCipheriv(this.algorithm, this.appKey, iv)
    value = cipher.update(value, encoding, 'base64')
    value += cipher.final('base64')

    if (!value) {
      throw new Error('Could not encrypt the data.')
    }

    // Once we have the encrypted value we will go ahead base64_encode the input
    // vector and create the MAC for the encrypted value so we can verify its
    // authenticity. Then, we'll JSON encode the data in a "payload" array.
    let mac = this.hash(iv = this.base64Encode(iv), value)
    let json = JSON.stringify({iv: iv, value: value, mac: mac})
    return this.base64Encode(json)
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
  decrypt (payload, encoding) {
    encoding = encoding || 'utf8'
    payload = this.getJsonPayload(payload)

    let iv = this.base64Decode(payload.iv, true)

    let decipher = crypto.createDecipheriv(this.algorithm, this.appKey, iv)
    var decrypted = decipher.update(payload.value, 'base64', encoding)
    decrypted += decipher.final(encoding)

    if (!decrypted) {
      throw new Error('Could not decrypt the data.')
    }
    return decrypted
  }

  /**
   * get the JSON object from the given payload
   *
   * @param  {String} payload
   * @return {Mixed}
   */
  getJsonPayload (payload) {
    payload = JSON.parse(this.base64Decode(payload))
    // If the payload is not valid JSON or does not have the proper keys set we will
    // assume it is invalid and bail out of the routine since we will not be able
    // to decrypt the given value. We'll also check the MAC for this encryption.
    if (!payload || this.invalidPayload(payload)) {
      throw new Error('The payload is invalid.')
    }
    if (!this.validMac(payload)) {
      throw new Error('The MAC is invalid.')
    }
    return payload
  }

  /**
   * Create a MAC for the given value
   *
   * @param  {String} iv
   * @param  {String} value
   * @return {String}
   */
  hash (iv, value) {
    return this.hashHmac('sha256', iv + value, this.appKey)
  }

  /**
   * Generate a keyed hash value using the HMAC method
   *
   * @param  {String} algo
   * @param  {String} data
   * @param  {String} key
   * @return {String}
   */
  hashHmac (algo, data, key) {
    return crypto.createHmac(algo, key).update(data).digest('hex')
  }

  /**
   * returns encoded base64 string
   *
   * @param  {String} unencoded
   * @return {String}
   */
  base64Encode (unencoded) {
    return new Buffer(unencoded || '').toString('base64')
  }

  /**
   * returns decoded base64 string/buffer
   *
   * @param  {String} encoded
   * @param  {Boolean} raw
   * @return {Mixed}
   */
  base64Decode (encoded, raw) {
    if (raw) {
      return new Buffer(encoded || '', 'base64')
    }
    return new Buffer(encoded || '', 'base64').toString('utf8')
  }

  /**
   * Verify that the encryption payload is valid.
   *
   * @param  {Mixed} data
   * @return {Boolean}
   */
  invalidPayload (data) {
    return typeof data !== 'object' || !data.hasOwnProperty('iv') || !data.hasOwnProperty('value') || !data.hasOwnProperty('mac')
  }

  /**
   * Determine if the MAC for the given payload is valid
   *
   * @param  object payload
   * @return {Boolean}
   */
  validMac (payload) {
    let bytes = crypto.randomBytes(this.getIvSize())
    let calcMac = this.hashHmac('sha256', this.hash(payload.iv, payload.value), bytes)
    return this.hashHmac('sha256', payload.mac, bytes) === calcMac
  }

  /**
   * Get the IV size for the cipher
   *
   * @return {Integer}
   */
  getIvSize () {
    return 16
  }

}

module.exports = Encryption
