'use strict'

const HttpExceptionProvider = require('fold').ServiceProvider

class StaticProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/src/HttpException',function(){
      require('../src/HttpException')
    })
  }
}

module.exports = HttpExceptionProvider
