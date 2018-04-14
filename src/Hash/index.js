'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Hash plain values using the provided hash algorithm.
 * It is considered to be used when saving user passwords to the database.
 *
 * @group Hash
 * @singleton Yes
 *
 * @class Hash
 * @constructor
 */
class Hash {
  constructor (driver) {
    /**
     * The driver in use for logging
     *
     * @type {Object}
     *
     * @attribute driver
     */
    this.driver = driver
  }

  /**
   * Hash plain value using the given driver.
   *
   * @method make
   * @async
   *
   * @param  {String} value
   * @param  {Object} config
   *
   * @return {String}
   *
   * @example
   * ```js
   * const hashed = await Hash.make('my-secret-password')
   * ```
   */
  make (value, config) {
    return this.driver.make(value, config)
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
    return this.driver.verify(value, hash)
  }
}

module.exports = Hash
