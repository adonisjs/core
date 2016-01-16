'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class SessionProvider extends ServiceProvider {

  * register () {
    const Session = require('../src/Session')
    this.app.singleton('Adonis/Src/Session', function (app) {
      const Config = app.use('Adonis/Src/Config')
      return new Session(Config)
    })

    this.app.manager('Adonis/Src/Session', Session)
  }
}

module.exports = SessionProvider
