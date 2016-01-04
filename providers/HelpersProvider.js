'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class HelpersProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Helpers', function () {
      return require('../src/Helpers')
    })
  }
}

module.exports = HelpersProvider
