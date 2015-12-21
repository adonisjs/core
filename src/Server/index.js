'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const CatLog = require('cat-log')
const helpers = require('./helpers')
const http = require('http')

class Server {

  constructor( Request, Response, Route, Helpers, Middleware, Static, Session) {
    this.Request = Request
    this.Response = Response
    this.Session = Session
    this.Route = Route
    this.middleware = Middleware
    this.static = Static
    this.helpers = Helpers
    this.log = new CatLog('adonis:framework')
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
  _finalHandler( resolvedRoute, request, response) {
    /**
     * if route is not registered, try looking for a static resource
     * or simply throw an error if static resource is not found
     */
    if (!resolvedRoute.handler) {
      this.static.serve(request.request, request.response)
        .catch(function (e) {
          helpers.handleRequestError(e, request, response)
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
  handle( req, res) {
    const self = this
    const request = new this.Request(req, res)
    const response = new this.Response(request, res)
    const session = new this.Session(req, res)
    const requestUrl = request.url()
    request.session = session
    /**
     * making request verb/method based upon _method or falling
     * back to original method
     * @type {String}
     */
    const method = request.input('_method', request.method())

    const resolvedRoute = this.Route.resolve(requestUrl, method, request.hostname())
    request._params = resolvedRoute.params

    this.log.verbose('request on url %s ', req.url)

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
   * @param String host
   * @param String port
   * @method listen
   * @return {void}
   */
  listen( host, port) {
    this.log.info('serving app on %s:%s', host, port)
    http.createServer(this.handle.bind(this)).listen(port, host)
  }

}

module.exports = Server
