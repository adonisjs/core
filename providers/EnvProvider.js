'use strict'

const ServiceProvider = require('fold').ServiceProvider
const Env = require('../src/Env')

class EnvProvider extends ServiceProvider {

  static get inject () {
    return ['Adonis/Src/Helpers']
  }

  * register () {
    this.app.singleton('Adonis/Src/Env', function (Helpers) {
      return new Env(Helpers)
    })
  }
}

module.exports = EnvProvider
