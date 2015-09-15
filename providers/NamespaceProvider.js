'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class NamespaceProvider extends ServiceProvider {

  /**
   * @function inject
   * @description Defining injections
   * @return {Array}
  */
  static get inject () {
    return ['Adonis/Src/Env', 'Adonis/Src/Helpers']
  }

  /**
   * @function register
   * @description Binding Namespace to ioc container
  */
  * register () {
    this.app.singleton('Adonis/Src/Namespace', function (Env, Helpers) {
      const Namespace = require('../src/Namespace')
      return new Namespace(Env, Helpers)
    })
  }

}

module.exports = NamespaceProvider
