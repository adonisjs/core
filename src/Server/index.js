"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Http server for adonis app
 */

let Router = require("../Router"),
  Request = require("../Request"),
  Response = require("../Response"),
  Logger = require("../Logger"),
  helpers = require("./helpers"),
  Ware = require("adonis-co-ware")(),
  url = require("url"),
  http = require("http");


// exporting server
let Server = exports = module.exports = {};


/**
 * start http server on a given port
 * @param  {Number} port
 */
Server.start = function(port) {

  Logger.info(`serving app on port ${port}`);

  http.createServer(function(req, res) {

    // clear old middlewares stack of every new request
    Ware.clear();

    let uri = url.parse(req.url).path,
      method = req.method,
      response = new Response(req, res),
      request = new Request(req);


    // if request is for a static resource
    if (helpers.is_static_resource(req.url)) {
      helpers.handle_as_static_resource(request, response)
      return
    }

    // if request is favicon respond with favicon
    if (helpers.is_favicon_request(uri)) {
      helpers.serve_favicon(request, response);
      return
    }

    // resolve route from Router
    helpers
      .resolve_and_return_handler(Router, uri, method)
      .then(function(resolved_route) {
        request.params = resolved_route.params;
        helpers.register_request_middlewares(Ware, resolved_route.middlewares);
        let finalHandler = helpers.craft_final_handler(resolved_route.controller, request, response)
        return Ware.run(request, response, finalHandler)
      })
      .then(function() {
        response.end();
      })
      .catch(function(error) {
        helpers.handle_http_errors(error, request, response);
      })
  }).listen(port);
}