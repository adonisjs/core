'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class LoggerProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Logger to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Logger', function () {
      return require('../src/Logger')
    })
  }
}

module.exports = LoggerProvider
