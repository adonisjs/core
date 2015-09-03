'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
const View = require('../src/View')

class ViewProvider extends ServiceProvider {

  static get inject () {
    return ['Adonis/Src/Helpers']
  }

  * register () {
    this.app.singleton('Adonis/Src/View', function (Helpers) {
      return new View(Helpers)
    })
  }
}

module.exports = ViewProvider
