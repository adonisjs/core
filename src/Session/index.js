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

  static drivers(){
    return Drivers
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
  static extend (key, value) {
    this.drivers[key] = value
  }

  constructor (Config) {
    const driver = Config.get('session.driver')
    let driverInstance = 'cookie'
    if(driver !== 'cookie'){
      driverInstance = Ioc.make(this.constructor.drivers[driver])
    }
    SessionManager.driver = driverInstance
    return SessionManager
  }

}

module.exports = Session
