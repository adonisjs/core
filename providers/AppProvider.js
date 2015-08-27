'use strict'

const ServiceProvider = require('fold').ServiceProvider

class AppProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/src/App',function(){
      require('../src/App')
    })
  }
}

module.exports = AppProvider
