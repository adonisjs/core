'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class AppProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding App to ioc container
   */
  * register () {
    this.app.singleton('Adonis/Src/App', function () {
      return require('../src/App')
    })
  }

}

module.exports = AppProvider
