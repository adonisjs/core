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
const NE = require('node-exceptions')

/**
 * Encrypt and decrypt values using nodeJs crypto, make
 * sure to set APP_KEY inside .env file.
 *
 * Not compatible with Laravel because they use serialize()/unserialize()
 * @class
 */
class Encryption {

  constructor (Config) {
    this.appKey = Config.get('app.appKey')
    this.algorithm = Config.get('app.encryption.algorithm', 'aes-256-cbc')

    if (!this.appKey) {
      throw new NE.RuntimeException('App key needs to be specified in order to make use of Encryption.', 500, 'E_MISSING_APPKEY')
    }

    if (!this.supported(this.appKey, this.algorithm)) {
      throw new NE.RuntimeException('The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths.', 500, 'E_INVALID_ENCRPYTION_CIPHER')
    }
  }

  /**
   * Determine if the given key and cipher combination is valid.
   *
   * @param  {String}  key
   * @param  {String}  cipher
   * @return {Boolean}
   */
  supported (key, cipher) {
    key = key || ''
    cipher = cipher || ''
    return (cipher.toLowerCase() === 'aes-128-cbc' && key.length === 16) || (cipher.toLowerCase() === 'aes-256-cbc' && key.length === 32)
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
    if (!value) {
      throw new NE.InvalidArgumentException('Could not encrypt the data.', 500, 'E_MISSING_PARAMETER')
    }

    encoding = encoding || 'utf8'
    let iv = crypto.randomBytes(this.getIvSize())

    const cipher = crypto.createCipheriv(this.algorithm, this.appKey, iv)
    value = cipher.update(value, encoding, 'base64')
    value += cipher.final('base64')

    // Once we have the encrypted value we will go ahead base64_encode the input
    // vector and create the MAC for the encrypted value so we can verify its
    // authenticity. Then, we'll JSON encode the data in a "payload" array.
    const mac = this.hash(iv = this.base64Encode(iv), value)
    const json = JSON.stringify({iv: iv, value: value, mac: mac})
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

    const iv = this.base64Decode(payload.iv, true)

    const decipher = crypto.createDecipheriv(this.algorithm, this.appKey, iv)
    let decrypted = decipher.update(payload.value, 'base64', encoding)
    decrypted += decipher.final(encoding)

    if (!decrypted) {
      throw new NE.RuntimeException('Could not decrypt the data.', 500, 'E_ENCRYPTION_DECRYPT_FAILED')
    }
    return decrypted
  }

  /**
   * get the JSON object from the given payload
   *
   * @param  {String} payload
   * @return {Mixed}
   *
   * @public
   */
  getJsonPayload (payload) {
    const json = this.base64Decode(payload)
    try {
      payload = JSON.parse(json)
    } catch (e) {
      throw new NE.RuntimeException('The payload is not an json object.', 500, 'E_MALFORMED_JSON')
    }
    // If the payload is not valid JSON or does not have the proper keys set we will
    // assume it is invalid and bail out of the routine since we will not be able
    // to decrypt the given value. We'll also check the MAC for this encryption.
    if (!payload || this.invalidPayload(payload)) {
      throw new NE.RuntimeException('The payload is invalid.', 500, 'E_INVALID_ENCRYPTION_PAYLOAD')
    }
    if (!this.validMac(payload)) {
      throw new NE.RuntimeException('The MAC is invalid.', 500, 'E_INVALID_ENCRYPTION_MAC')
    }
    return payload
  }

  /**
   * Create a MAC for the given value
   *
   * @param  {String} iv
   * @param  {String} value
   * @return {String}
   *
   * @public
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
   *
   * @public
   */
  hashHmac (algo, data, key) {
    return crypto.createHmac(algo, key).update(data).digest('hex')
  }

  /**
   * returns encoded base64 string
   *
   * @param  {String} unencoded
   * @return {String}
   *
   * @public
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
   *
   * @public
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
   *
   * @public
   */
  invalidPayload (data) {
    return typeof data !== 'object' || !data.hasOwnProperty('iv') || !data.hasOwnProperty('value') || !data.hasOwnProperty('mac')
  }

  /**
   * Determine if the MAC for the given payload is valid
   *
   * @param  object payload
   * @return {Boolean}
   *
   * @public
   */
  validMac (payload) {
    const bytes = crypto.randomBytes(this.getIvSize())
    const calcMac = this.hashHmac('sha256', this.hash(payload.iv, payload.value), bytes)
    return this.hashHmac('sha256', payload.mac, bytes) === calcMac
  }

  /**
   * Get the IV size for the cipher
   *
   * @return {Integer}
   *
   * @public
   */
  getIvSize () {
    return 16
  }

}

module.exports = Encryption
