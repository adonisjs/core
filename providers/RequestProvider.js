'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class RequestProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Request', function (app) {
      const Request = require('../src/Request')
      const Config = app.use('Adonis/Src/Config')
      return new Request(Config)
    })
  }
}

module.exports = RequestProvider
