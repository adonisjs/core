'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class ResponseProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Response', function (app) {
      const View = app.use('Adonis/Src/View')
      const Route = app.use('Adonis/Src/Route')
      const Response = require('../src/Response')
      return new Response(View, Route)
    })
  }
}

module.exports = ResponseProvider
