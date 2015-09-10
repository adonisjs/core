'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class HttpExceptionProvider extends ServiceProvider {

  /**
   * @function register
   * @description Binding HttpException to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/HttpException', function () {
      return require('../src/HttpException')
    })
  }
}

module.exports = HttpExceptionProvider
