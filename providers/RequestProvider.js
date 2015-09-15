'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class RequestProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Request to ioc container
  */
  * register () {
    this.app.bind('Adonis/Src/Request', function () {
      return require('../src/Request')
    })
  }
}

module.exports = RequestProvider
