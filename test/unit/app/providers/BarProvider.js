'use strict'

const ServiceProvider = require('../../../../src/ServiceProvider')

class BarProvider extends ServiceProvider {

  async boot () {
    this.message = this.app.use('App/Foo')
  }

  register () {
    this.app.bind('App/Bar', () => {
      return this.message
    })
  }

}

module.exports = BarProvider
