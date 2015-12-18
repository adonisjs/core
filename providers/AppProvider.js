'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class AppProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/App', function () {
      return require('../src/App')
    })
  }
}

module.exports = AppProvider
