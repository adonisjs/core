'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Logger = require('../Logger')
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
    this.log = new Logger('adonis:framework')
  }

  /**
   * @description responds to request by finding registered
   * route or fallbacks to static resource.
   * @method _finalHandler
   * @param  {Object}      request  [description]
   * @param  {Object}      response [description]
   * @return {void}               [description]
   * @private
   */
  _finalHandler (resolvedRoute, request, response) {

    /**
     * if route is not registered, try looking for a static resource
     * or simply throw an error if static resource is not found
     */
    if(!resolvedRoute.handler){
      this.static.serve(request.request, request.response)
      .catch(function (e){
        helpers.handleRequestError(e, response)
      })
      return
    }

    /**
     * calling request action handler by making a middleware
     * layer of named middleware and finally invoking
     * route action.
     */
    helpers.callRouteAction(resolvedRoute, request, response, this.middleware, this.helpers.appNameSpace())
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
    const self = this
    const request = new this.Request(req, res)
    const response = new this.Response(request, res)
    const requestUrl = request.url()
    /**
     * making request verb/method based upon _method or falling
     * back to original method
     * @type {String}
     */
    const method = request.input('_method',request.method())

    const resolvedRoute = this.Route.resolve(requestUrl,method,request.hostname())
    request._params = resolvedRoute.params

    this.log.verbose('request on url %s ',req.url)

    /**
     * @description final method to call after executing
     * global middleware
     * @method finalHandler
     * @return {Function}
     */
    const finalHandler = function * () {
      self._finalHandler(resolvedRoute, request, response)
    }
    helpers.respondRequest(this.middleware, request, response, finalHandler)
  }

  /**
   * starting a server on a given port
   * @method listen
   * @return {void}
   */
  listen (port) {
    port = port || process.env.APP_PORT
    http.createServer(this.handle.bind(this)).listen(port)
  }

}


module.exports = Server
