'use strict'

const ServiceProvider = require('fold').ServiceProvider

class StaticProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/Src/Static',function(){
      return require('../src/Static')
    })
  }
}

module.exports = StaticProvider
