'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const bcrypt = require('bcryptjs')

/**
 * Hash plain values using [bcryptjs](https://www.npmjs.com/package/bcryptjs).
 *
 * @group Hash
 *
 * @class Bcrypt
 */
class Bcrypt {
  constructor () {
    this.config = {}
  }

  /**
   * Consumes bcrypt config
   *
   * @method setConfig
   *
   * @param  {Object}  config
   */
  setConfig (config) {
    this.config = config
  }

  /**
   * Hash plain value using bcrypt.
   *
   * @method make
   * @async
   *
   * @param  {String} value
   * @param  {Object} config
   *
   * @return {String}
   */
  make (value, config = {}) {
    let rounds = null

    /**
     * In order to be back compatible, we have to accept strings and numbers
     * as config rounds.
     */
    if (typeof (config) === 'string' || typeof (config) === 'number') {
      rounds = Number(config)
    } else {
      rounds = config.rounds || this.config.rounds || 10
    }

    return new Promise(function (resolve, reject) {
      bcrypt.hash(value, rounds, function (error, hash) {
        if (error) {
          return reject(error)
        }
        resolve(hash)
      })
    })
  }

  /**
   * Verify an existing hash with the plain value. Though this
   * method returns a promise, it never rejects the promise
   * and this is just for the sake of simplicity, since
   * bcrypt errors are not something that you can act
   * upon.
   *
   * @method verify
   * @async
   *
   * @param  {String} value
   * @param  {String} hash
   *
   * @return {Boolean}
   */
  verify (value, hash) {
    return new Promise(function (resolve, reject) {
      bcrypt.compare(value, hash, function (error, response) {
        if (error) {
          return resolve(false)
        }
        resolve(response)
      })
    })
  }
}

module.exports = Bcrypt
