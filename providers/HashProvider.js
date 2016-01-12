'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class HashProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Hash', function () {
      return require('../src/Hash')
    })
  }
}

module.exports = HashProvider
