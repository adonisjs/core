'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class RouteProvier extends ServiceProvider {
  * register () {
    this.app.singleton('Adonis/Src/Route', function () {
      return require('../src/Route')
    })
  }
}

module.exports = RouteProvier
