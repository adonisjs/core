'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class EncryptionProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Encryption', function (app) {
      const Encryption = require('../src/Encryption')
      const Config = app.use('Adonis/Src/Config')
      return new Encryption(Config)
    })
  }
}

module.exports = EncryptionProvider
