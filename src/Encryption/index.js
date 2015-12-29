'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const crypto = require('crypto')

class Encryption {

  constructor (Env) {
    this.appKey = Env.get('APP_KEY')
    this.algorithm = Env.get('ENCRYPTION', 'aes-256-cbc')

    /**
     * throwing error when APP_KEY is not defined as encryption
     * does not make sense without a key
     */
    if (!this.appKey) {
      throw new Error('Encryption cannot work without APP_KEY')
    }
  }

  /**
   * @description encrypts a given value
   * @method encrypt
   * @param  {Mixed} value
   * @param  {String} encoding
   * @return {String}
   * @public
   */
  encrypt (value, encoding) {
    const cipher = crypto.createCipher(this.algorithm, this.appKey)
    encoding = encoding || 'utf8'
    cipher.update(value, encoding, 'hex')
    return cipher.final('hex')
  }

  /**
   * @description decrypts encrypted value
   * @method decrypt
   * @param  {String} value
   * @param  {String} encoding
   * @return {Mixed}
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
