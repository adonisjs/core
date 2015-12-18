'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class SessionProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Session', function (app) {
      const Config = app.use('Adonis/Src/Config')
      const Session = require('../src/Session')
      return new Session(Config)
    })
  }
}

module.exports = SessionProvider
