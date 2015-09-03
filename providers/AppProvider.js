'use strict'

const ServiceProvider = require('fold').ServiceProvider

class AppProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/App', function () {
      return require('../src/App')
    })
  }
}

module.exports = AppProvider
