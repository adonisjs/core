'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
const Namespace = require('../src/Namespace')

class NamespaceProvider extends ServiceProvider {

  static get inject () {
    return ['Adonis/Src/Env', 'Adonis/Src/Helpers']
  }

  * register () {
    this.app.singleton('Adonis/Src/Namespace', function (Env, Helpers) {
      return new Namespace(Env, Helpers)
    })
  }

}

module.exports = NamespaceProvider
