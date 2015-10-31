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
  const server = new Server(Request, Response, Route, Helpers, Middleware, staticServer)
  return server;
}
