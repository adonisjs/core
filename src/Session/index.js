'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2105 Harminder Virk
 * MIT Licensed
*/

const Drivers = require('./Drivers')
const Ioc = require('adonis-fold').Ioc
const SessionManager = require('./SessionManager')

/**
 * @class Session
 * @description Session provider
 */
class Session {

  static drivers() {
    return {}
  }

  /**
   * @description extend method for ioc to extend
   * session provider
   * @method extend
   * @param  {String} key
   * @param  {Object} value
   * @return {void}
   * @public
   */
  static extend( key, value) {
    this.drivers[key] = value
  }

  constructor( Config) {
    const driver = Config.get('session.driver')
    const sessionPath = Config.get('session.path', '/')
    const sessionAge = Config.get('session.age')
    const sessionBrowserClear = Config.get('session.clearWithBrowser', false)
    const sessionDomain = Config.get('session.domain')
    const sessionCookieName = Config.get('session.cookie', 'adonis-session')
    const sessionSecure = Config.get('session.secure', false)

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
      }
      else if (this.constructor.drivers[driver]) {
        /**
         * return driver instance if one of the extended
         * drivers
         */
        driverInstance = this.constructor.drivers[driver]
      } else {
        /**
         * throw error when unable to locate driver
         */
        throw new Error('Unable to locate ' + driver + ' session driver')
      }
    }
    SessionManager.driver = driverInstance
    SessionManager.options = sessionOptions
    return SessionManager
  }

}

module.exports = Session
