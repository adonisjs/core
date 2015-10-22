'use strict'

const Drivers = require('./Drivers')
const Ioc = require('adonis-fold').Ioc
const SessionManager = require('./SessionManager')

class Session {

  static drivers(){
    return Drivers
  }

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
