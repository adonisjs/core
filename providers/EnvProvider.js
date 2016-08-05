'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class EnvProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Env', function (app) {
      const Env = require('../src/Env')
      const Helpers = app.use('Adonis/Src/Helpers')
      return new Env(Helpers)
    })
  }
}

module.exports = EnvProvider
