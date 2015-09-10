'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class RouteProvier extends ServiceProvider {

  /**
   * @function register
   * @description Binding Route to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Route', function () {
      return require('../src/Route')
    })
  }
}

module.exports = RouteProvier
