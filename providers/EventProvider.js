'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class EventProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Event', function (app) {
      const Event = require('../src/Event')
      const Config = app.use('Adonis/Src/Config')
      return new Event(Config)
    })
  }
}

module.exports = EventProvider
