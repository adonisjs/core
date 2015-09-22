'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class SessionProvider extends ServiceProvider {

  /**
   * @function inject
   * @description Defining injections
   * @return {Array}
  */
  static get inject(){
    return ["Adonis/Src/Helpers","Adonis/Src/Config"]
  }

  /**
   * @function register
   * @description Binding Server to ioc container
  */
  * register () {
    this.app.bind('Adonis/Src/Session', function (Helpers,Config) {
      const Session = require('../src/Session')
      return new Session(Helpers,Config)
    })
  }
}

module.exports = SessionProvider
