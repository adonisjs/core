'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class HelpersProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Helpers to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Helpers', function () {
      return require('../src/Helpers')
    })
  }
}

module.exports = HelpersProvider
