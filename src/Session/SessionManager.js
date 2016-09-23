'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Drivers = require('./Drivers')
const Ioc = require('adonis-fold').Ioc
const Session = require('./index')
const CE = require('../Exceptions')

/**
 * Makes driver instance from native or extended driver. Executes
 * the callback when unable to find the specified driver.
 *
 * @param  {String}   driver
 * @param  {Object}   drivers
 * @param  {Object}   extendedDrivers
 * @param  {Function} callback
 *
 * @return {Object}
 *
 * @private
 */
const _makeDriverInstance = (driver, drivers, extendedDrivers, callback) => {
  const driverInstance = drivers[driver] ? Ioc.make(drivers[driver]) : extendedDrivers[driver]
  if (!driverInstance) {
    callback()
  }
  return driverInstance
}

/**
 * Session class for reading and writing sessions
 * during http request
 * @returns {Session}
 * @class
 */
class SessionManager {

  /**
   * Extend session provider by adding a new named
   * driver. This method is used the IoC container, so
   * feel free to use Ioc.extend syntax.
   *
   * @param  {String} key - name of the driver
   * @param  {Object} value - Driver implmentation
   *
   * @example
   * Ioc.extend('Adonis/Src/Session', 'redis', (app) => {
   *   return new RedisImplementation()
   * })
   */
  static extend (key, value) {
    this.drivers = this.drivers || {}
    this.drivers[key] = value
  }

  /**
   * @constructor
   */
  constructor (Config) {
    const driver = Config.get('session.driver')
    this.constructor.drivers = this.constructor.drivers || {}

    Session.driver = _makeDriverInstance(driver, Drivers, this.constructor.drivers, () => {
      throw CE.RuntimeException.invalidSessionDriver(driver)
    })
    Session.config = Config
    return Session
  }
}

module.exports = SessionManager
