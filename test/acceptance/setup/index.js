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
    return key === 'http.trustProxy' ? true : 2
  }
}


module.exports = function () {
  const Env = {
    get: function () {
      return 'false'
    }
  }
  Helpers.load(path.join(__dirname,'../package.test.json'))
  const view = new View(Helpers, Env, Route)
  const Response = new ResponseBuilder(view, Route)
  const staticServer = new Static(Helpers)
  const server = new Server(Request, Response, Route, Helpers, Middleware, staticServer, Session, Config)
  return server;
}
