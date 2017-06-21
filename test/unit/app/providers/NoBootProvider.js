'use strict'

const ServiceProvider = require('../../../../src/ServiceProvider')

class NoBootProvider extends ServiceProvider {
  register () {
  }
}

module.exports = NoBootProvider
