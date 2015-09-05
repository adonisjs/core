'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
const View = require('../src/View')

class ViewProvider extends ServiceProvider {

  static get inject () {
    return ['Adonis/Src/Helpers','Adonis/Src/Env','Adonis/Src/Route']
  }

  * register () {
    this.app.singleton('Adonis/Src/View', function (Helpers,Env,Route) {
      return new View(Helpers,Env,Route)
    })
  }
}

module.exports = ViewProvider
