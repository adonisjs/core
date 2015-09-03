'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
const Response = require('../src/Response')

class ResponseProvider extends ServiceProvider {

  static get inject () {
    return ['Adonis/Src/View']
  }

  * register () {
    this.app.singleton('Adonis/Src/Response', function (View) {
      return new Response(View)
    })
  }
}

module.exports = ResponseProvider
