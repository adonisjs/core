'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider
const Env = require('../src/Env')

class EnvProvider extends ServiceProvider {

  /**
   * @function inject
   * @description Defining injections
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Helpers']
  }

  /**
   * @function register
   * @description Binding Env to ioc container
   */
  * register () {
    this.app.singleton('Adonis/Src/Env', function (Helpers) {
      return new Env(Helpers)
    })
  }
}

module.exports = EnvProvider
