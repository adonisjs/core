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
  cluster = require("cluster"),
  http = require("http");


/**
 * setting up a http server and saving instance
 * locally.
 */
let serverInstance = http.createServer(function(req, res) {

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
});

/**
 * exporting Server module
 */
let Server = exports = module.exports = {};


/**
 * stops currently running http server
 */
Server.stop = function() {
  serverInstance.close();
}


/**
 * start http server on a given port
 * @param  {Number} port
 */
Server.start = function(port) {
  Logger.info(`serving app on port ${port}`);
  serverInstance.listen(port);
}


/**
 * start http server in cluster mode on a given port
 * @param  {Number} port
 */
Server.cluster = function(port) {

  if(cluster.isMaster){
    
    var cpuCount = require("os").cpus().length;
    for(let i=0;i<cpuCount; i+=1){
      cluster.fork();
    }

    cluster.on("exit",function(worker){
      Logger.warn(`worker ${worker.process.pid} died`);
      cluster.fork();      
    });

  }else{
    Server.start(port);
  }
}
