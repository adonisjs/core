'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider
const View = require('../src/View')

class ViewProvider extends ServiceProvider {

  /**
   * @function inject
   * @description Defining injections
   * @return {Array}
  */
  static get inject () {
    return ['Adonis/Src/Helpers','Adonis/Src/Env','Adonis/Src/Route']
  }

  /**
   * @function register
   * @description Binding View to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/View', function (Helpers,Env,Route) {
      return new View(Helpers,Env,Route)
    })
  }
}

module.exports = ViewProvider
