'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class LogProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Log', function (app) {
      const Log = require('../src/Log')
      const Config = app.use('Adonis/Src/Config')
      return new Log(Config)
    })
  }
}

module.exports = LogProvider
