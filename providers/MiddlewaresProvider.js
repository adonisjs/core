'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class MiddlewaresProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/Middlewares', function () {
      return require('../src/Middlewares')
    })
  }
}

module.exports = MiddlewaresProvider
