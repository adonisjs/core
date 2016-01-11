'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class RequestProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Request', function () {
      return require('../src/Request')
    })
  }
}

module.exports = RequestProvider
