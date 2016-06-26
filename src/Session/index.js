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
const SessionManager = require('./SessionManager')
const NE = require('node-exceptions')

/**
 * Session class for reading and writing sessions
 * during http request
 * @returns {SessionManager}
 * @class
 */
class Session {

  /**
   * extend method for ioc to extend
   * session provider
   *
   * @param  {String} key - name of the driver
   * @param  {Object} value - Driver implmentation
   *
   * @example
   * Session.extend('redis', new RedisImplementation)
   *
   * @public
   */
  static extend (key, value) {
    this.drivers = this.drivers || {}
    this.drivers[key] = value
  }

  constructor (Config) {
    const driver = Config.get('session.driver')
    const sessionPath = Config.get('session.path', '/')
    const sessionAge = Config.get('session.age')
    const sessionBrowserClear = Config.get('session.clearWithBrowser', false)
    const sessionDomain = Config.get('session.domain')
    const sessionCookieName = Config.get('session.cookie', 'adonis-session')
    const sessionSecure = Config.get('session.secure', false)
    this.constructor.drivers = this.constructor.drivers || {}

    const sessionOptions = {
      path: sessionPath,
      domain: sessionDomain,
      secure: sessionSecure,
      browserClear: sessionBrowserClear,
      age: sessionAge,
      cookie: sessionCookieName
    }

    let driverInstance = 'cookie'
    if (driver !== 'cookie') {
      if (Drivers[driver]) {
        /**
         * make instance of core drivers using ioc make
         * method
         */
        driverInstance = Ioc.make(Drivers[driver])
      } else if (this.constructor.drivers[driver]) {
        /**
         * return driver instance if one of the extended
         * drivers
         */
        driverInstance = this.constructor.drivers[driver]
      } else {
        /**
         * throw error when unable to locate driver
         */
        throw new NE.RuntimeException(`Unable to locate ${driver} session driver`)
      }
    }
    SessionManager.driver = driverInstance
    SessionManager.options = sessionOptions
    SessionManager.config = Config
    return SessionManager
  }
}

module.exports = Session
