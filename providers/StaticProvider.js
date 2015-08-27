'use strict'

const ServiceProvider = require('fold').ServiceProvider

class StaticProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/src/Static',function(){
      require('../src/Static')
    })
  }
}

module.exports = StaticProvider
