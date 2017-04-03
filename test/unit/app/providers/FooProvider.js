'use strict'

const ServiceProvider = require('../../../../src/ServiceProvider')

class Provider extends ServiceProvider {
  register () {
    this.app.bind('App/Foo', function () {
      return 'foo'
    })
  }
}

module.exports = Provider
