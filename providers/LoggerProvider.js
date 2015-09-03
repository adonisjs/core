'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class LoggerProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/Logger', function () {
      return require('../src/Logger')
    })
  }
}

module.exports = LoggerProvider
