'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class StaticProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/Static', function () {
      return require('../src/Static')
    })
  }
}

module.exports = StaticProvider
