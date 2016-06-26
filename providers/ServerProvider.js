'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class ServerProvider extends ServiceProvider {

  * register () {
    this.app.bind('Adonis/Src/Server', function (app) {
      const Request = app.use('Adonis/Src/Request')
      const Response = app.use('Adonis/Src/Response')
      const Route = app.use('Adonis/Src/Route')
      const Helpers = app.use('Adonis/Src/Helpers')
      const Middleware = app.use('Adonis/Src/Middleware')
      const Static = app.use('Adonis/Src/Static')
      const Session = app.use('Adonis/Src/Session')
      const Config = app.use('Adonis/Src/Config')
      const Event = app.use('Adonis/Src/Event')
      const Server = require('../src/Server')
      return new Server(Request, Response, Route, Helpers, Middleware, Static, Session, Config, Event)
    })
  }
}

module.exports = ServerProvider
