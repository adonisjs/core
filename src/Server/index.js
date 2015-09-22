'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const helpers = require('./helpers')
const Ware = require('adonis-co-ware')()
const url = require('url')
const http = require('http')

function Server (Route, Request, Response, Logger, Session) {

  this.Logger = Logger

  /**
   * setting up a http server and saving instance
   * locally.
   */
  this.serverInstance = http.createServer(function (req, res) {
    // clear old middlewares stack of every new request
    Ware.clear()

    let uri = url.parse(req.url).pathname
    let method = req.method
    let response = new Response(req, res)
    let session = new Session(req,res)
    let request = new Request(req)

    /**
     * setting up session on request object which
     * makes session methods available on
     * request object itself.
     * @type {[type]}
     */
    request.session = session

    /**
     * if request is for a static resource , serve static resource
     * and return
     */
    if (helpers.isStaticResource(req.url)) {
      helpers.handleAsStaticResource(request, response)
      return
    }

    // if request is for favicon , serve favicon and return
    if (helpers.isFaviconRequest(uri)) {
      helpers.serveFavicon(request, response)
      return
    }

    /**
     * finally try to resolve url as one of the registered
     * routes and serve if resolved.
     */
    helpers
      .resolveAndReturnHandler(Route, uri, method)
      .then(function (resolvedRoute) {
        // setup params property on request object
        request.request.params = resolvedRoute.params

        // register middleware to be invoked
        helpers.registerRequestMiddleware(Ware, resolvedRoute.middlewares)

        // create finalHandler as a generator method
        let finalHandler = helpers.craftFinalHandler(resolvedRoute.controller, request, response)

        // returns ware instance
        return Ware.run(request, response, finalHandler)

      })
      .then(function () {
        response.end()
      })
      .catch(function (error) {
        helpers.handleHttpErrors(error, request, response)
      })
  })
}

/**
 * @function stop
 * @description stops currently running http server
 * @public
 */
Server.prototype.stop = function () {
  this.serverInstance.close()
}

/**
 * @function start
 * @description start http server on a given port
 * @param  {Number} port
 * @public
 */
Server.prototype.start = function (port) {
  this.Logger.info(`serving app on port ${port}`)
  this.serverInstance.listen(port)
}

module.exports = Server
