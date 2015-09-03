'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Http server for adonis app
 */

const helpers = require('./helpers')
const Ware = require('adonis-co-ware')()
const url = require('url')
const http = require('http')

function Server(Route,Request,Response,Logger){

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
      let request = new Request(req)

      /**
       * if request is for a static resource , serve static resource
       * and return
       */
      if (helpers.is_static_resource(req.url)) {
        helpers.handle_as_static_resource(request, response)
        return
      }

      /**
       * if request is for favicon , serve favicon and return
       */
      if (helpers.is_favicon_request(uri)) {
        helpers.serve_favicon(request, response)
        return
      }

      /**
       * finally try to resolve url as one of the registered
       * routes and serve if resolved.
       */
      helpers
      .resolve_and_return_handler(Route, uri, method)
      .then(function (resolved_route) {
        /**
         * setup params property on request object
         */
        request.request.params = resolved_route.params

        /**
         * register middlewares to be invoked
         */
        helpers.register_request_middlewares(Ware, resolved_route.middlewares)

        /**
         * create finalHandler as a generator method
         */
        let finalHandler = helpers.craft_final_handler(resolved_route.controller, request, response)

        /**
         * return ware instance
         */
        return Ware.run(request, response, finalHandler)

      })
      .then(function () {
        response.end()
      })
      .catch(function (error) {
        helpers.handle_http_errors(error, request, response)
      })
  })
}

/**
 * stops currently running http server
 */
Server.prototype.stop = function () {
  this.serverInstance.close()
}

/**
 * start http server on a given port
 * @param  {Number} port
 */
Server.prototype.start = function (port) {
  this.Logger.info(`serving app on port ${port}`)
  this.serverInstance.listen(port)
}

module.exports = Server
