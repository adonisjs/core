'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * A hash mock class to be used within tests, which simply
 * doesn't hash passwords at all.
 *
 * @class HashMock
 * @constructor
 */
class HashMock {
  /**
   * Returns the value back as it is. Have to be async
   * to be API compatable.
   *
   * @method make
   * @async
   *
   * @param  {String} value
   * @param  {Number} [rounds]
   *
   * @return {String}
   *
   * @example
   * ```js
   * const hashed = await Hash.make('my-secret-password')
   * ```
   */
  async make (value, rounds = 10) {
    return value
  }

  /**
   * Verify two strings
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
  async verify (value, hash) {
    return value === hash
  }
}

module.exports = new HashMock()
