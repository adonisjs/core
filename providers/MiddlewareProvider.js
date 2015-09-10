'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class MiddlewareProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding Middleware to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Middleware', function () {
      return require('../src/Middleware')
    })
  }

}

module.exports = MiddlewareProvider
