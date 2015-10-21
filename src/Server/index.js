'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const debug = require('debug')('adonis:framework')
const helpers = require('./helpers')
const http = require('http')

class Server {

  constructor (Request, Response, Route, Helpers, Middleware, Static) {
    this.Request = Request
    this.Response = Response
    this.Route = Route
    this.middleware = Middleware
    this.static = Static
    this.helpers = Helpers
  }

  /**
   * @description createServer handler to respond to a given http request
   * @method handle
   * @param  {Object} req
   * @param  {Object} res
   * @return {void}
   * @public
   */
  handle (req, res) {
    const request = new this.Request(req, res)
    const response = new this.Response(request, res)
    const requestUrl = request.url()

    if(requestUrl === '/favicon.ico' || requestUrl === 'favicon.ico'){
      debug('serving favicon')
      this.static.serve(req, res, function (err) {
        helpers.staticResourceDone(err, response)
      })
      return
    }

    debug('request on url %s ',requestUrl)
    const resolvedRoute = this.Route.resolve(requestUrl,request.method(),request.hostname())

    /**
     * try serving static resource if route is not found
     */
    if(!resolvedRoute.handler){
      this.static.serve(req, res, function (err) {
        helpers.staticResourceDone(err, response)
      })
      return
    }

    debug('resolved route for %s ', requestUrl)
    helpers.callRouteHandler(resolvedRoute, request, response, this.middleware, debug, this.helpers.appNamespace())
  }

  /**
   * starting a server on a given port
   * @method listen
   * @return {void}
   */
  listen () {
    http.createServer(this.handle.bind(this)).listen(process.env.APP_PORT)
  }

}


module.exports = Server
