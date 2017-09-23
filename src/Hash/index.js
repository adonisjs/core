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
 * It is considered to be used when saving user passwords to the database.
 *
 * @binding Adonis/Src/Hash
 * @group Core
 * @alias Hash
 * @singleton Yes
 *
 * @class Hash
 * @static
 */
class Hash {
  /**
   * Hash plain value using bcrypt.
   *
   * @method make
   * @async
   *
   * @param  {String} value
   * @param  {Number} [rounds = 10]
   *
   * @return {String}
   *
   * @example
   * ```js
   * const hashed = await Hash.make('my-secret-password')
   * ```
   */
  make (value, rounds = 10) {
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
   *
   * @example
   * ```
   * const verified = await Hash.verify('password', 'existing-hash')
   * if (verified) {
   * }
   * ```
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

module.exports = new Hash()
