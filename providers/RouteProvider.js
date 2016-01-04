'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class RouteProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Route', function () {
      return require('../src/Route')
    })
  }
}

module.exports = RouteProvider
