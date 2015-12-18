'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class StaticProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Static', function (app) {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Static = require('../src/Static')
      return new Static(Helpers)
    })
  }
}

module.exports = StaticProvider
