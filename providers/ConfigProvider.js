'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class ConfigProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Config', function (app) {
      const Config = require('../src/Config')
      const Helpers = app.use('Adonis/Src/Helpers')
      return new Config(Helpers)
    })
  }
}

module.exports = ConfigProvider
