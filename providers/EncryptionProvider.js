'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class EncryptionProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Encryption', function (app) {
      const Encryption = require('../src/Encryption')
      const Env = app.use('Adonis/Src/Env')
      return new Encryption(Env)
    })
  }
}

module.exports = EncryptionProvider
