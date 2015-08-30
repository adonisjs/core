'use strict'

const ServiceProvider = require('fold').ServiceProvider

class RouterProvier extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/src/Router',function(){
      return require('../src/Router')
    })
  }
}

module.exports = RouterProvier
