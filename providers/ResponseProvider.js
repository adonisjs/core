'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

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
      const Response = require('../src/Response')
      return new Response(View)
    })
  }
}

module.exports = ResponseProvider
