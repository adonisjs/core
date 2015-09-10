'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider
const Request = require('../src/Request')

class RequestProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Request to ioc container
  */
  * register () {
    this.app.bind('Adonis/Src/Request', function () {
      return Request
    })
  }
}

module.exports = RequestProvider
