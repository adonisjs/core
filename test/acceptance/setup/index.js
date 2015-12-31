'use strict'

const Server = require('../../../src/Server')
const Route = require('../../../src/Route')
const Request = require('../../../src/Request')
const ResponseBuilder = require('../../../src/Response')
const View = require('../../../src/View')
const Middleware = require('../../../src/Middleware')
const Helpers = require('../../../src/Helpers')
const path = require('path')
const Static = require('../../../src/Static')

class Session {}

const Config = {
  get: function (key) {
    switch (key) {
      case 'http.trustProxy':
        return false
      case 'app.appKey':
        return null
      default:
        return 0
    }
  }
}


module.exports = function () {
  Helpers.load(path.join(__dirname,'../package.test.json'))
  const view = new View(Helpers, Config, Route)
  const Response = new ResponseBuilder(view, Route, Config)
  const staticServer = new Static(Helpers, Config)
  const server = new Server(Request, Response, Route, Helpers, Middleware, staticServer, Session, Config)
  return server;
}
