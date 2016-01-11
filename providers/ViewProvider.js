'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class ViewProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/View', function (app) {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = app.use('Adonis/Src/Config')
      const Route = app.use('Adonis/Src/Route')
      const View = require('../src/View')
      return new View(Helpers, Config, Route)
    })
  }
}

module.exports = ViewProvider
