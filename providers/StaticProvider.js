'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class StaticProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Static', function (app) {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = app.use('Adonis/Src/Config')
      const Static = require('../src/Static')
      return new Static(Helpers, Config)
    })
  }
}

module.exports = StaticProvider
