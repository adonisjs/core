'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const argon2 = require('argon2')

/**
 * Hash plain values using [argon2](https://github.com/P-H-C/phc-winner-argon2).
 *
 * @group Core
 * @singleton Yes
 *
 * @class Argon
 * @static
 */
class Argon {
  /**
   * Hash plain value using argon2.
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
    return argon2.hash(value, config)
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
  async verify (value, hash) {
    if (value === undefined) {
      return false
    }

    if (await argon2.verify(hash, value)) {
      return true
    }

    return false
  }
}

module.exports = Argon
