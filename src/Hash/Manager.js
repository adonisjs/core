'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc } = require('@adonisjs/fold')
const GE = require('@adonisjs/generic-exceptions')
const Drivers = require('./Drivers')

/**
 * Hash plain values using the provided hash algorithm.
 * It is considered to be used when saving user passwords to the database.
 *
 * @manager
 * @group Hash
 * @singleton Yes
 *
 * @class HashManager
 * @static
 */
class HashManager {
  constructor () {
    this._drivers = {}
  }

  /**
   * Extend hasher by adding your own drivers
   *
   * @method extend
   *
   * @param  {String} name
   * @param  {Object} implementation
   *
   * @return {void}
   */
  extend (name, implementation) {
    this._drivers[name] = implementation
  }

  /**
   * Returns the driver instance for a given driver.
   *
   * @method driver
   *
   * @param  {String} name
   * @param  {Object} config
   *
   * @return {Object}
   */
  driver (name, config) {
    name = name.toLowerCase()
    const Driver = Drivers[name] || this._drivers[name]

    /**
     * If driver doesn't exists, let the end user know
     * about it
     */
    if (!Driver) {
      throw GE.RuntimeException.invoke(`Hash driver ${name} does not exists.`, 500, 'E_INVALID_HASHER_DRIVER')
    }

    const driverInstance = ioc.make(Driver)
    driverInstance.setConfig(config)
    return driverInstance
  }
}

module.exports = new HashManager()
