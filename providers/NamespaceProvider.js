'use strict'

const ServiceProvider = require('fold').ServiceProvider
const Namespace = require('../src/Namespace')

class NamespaceProvider extends ServiceProvider{

  static get inject(){
    return ["Adonis/Src/Env"]
  }

  *register(){
    this.app.singleton('Adonis/Src/Namespace',function(Env){
      return new Namespace(Env)
    })
  }

}

module.exports = NamespaceProvider
