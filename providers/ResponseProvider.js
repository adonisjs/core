'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider
const Response = require('../src/Response')

class ResponseProvider extends ServiceProvider {

  /**
   * @function inject
   * @description Defining injections
   * @return {Array}
  */
  static get inject () {
    return ['Adonis/Src/View']
  }

  /**
   * @function register
   * @description Binding Response to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Response', function (View) {
      return new Response(View)
    })
  }
}

module.exports = ResponseProvider
