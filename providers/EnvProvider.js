'use strict'

const ServiceProvider = require('fold').ServiceProvider

class EnvProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/Src/Env',function(){
      return require('../src/Env')
    })
  }
}

module.exports = EnvProvider
