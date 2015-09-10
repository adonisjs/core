'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class StaticProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Static to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Static', function () {
      return require('../src/Static')
    })
  }
}

module.exports = StaticProvider
