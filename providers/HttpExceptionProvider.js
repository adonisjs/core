'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class HttpExceptionProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/HttpException', function () {
      return require('../src/HttpException')
    })
  }
}

module.exports = HttpExceptionProvider
