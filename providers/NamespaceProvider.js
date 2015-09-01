'use strict'

const ServiceProvider = require('fold').ServiceProvider

class NamespaceProvider extends ServiceProvider{
  *register(){
    this.app.singleton('Adonis/Src/Namespace',function(){
      return require('../src/Namespace')
    })
  }
}

module.exports = NamespaceProvider
