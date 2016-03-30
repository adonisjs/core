'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const CatLog = require('cat-log')
const helpers = require('./helpers')
const http = require('http')

class Server {

  constructor (Request, Response, Route, Helpers, Middleware, Static, Session, Config) {
    this.Request = Request
    this.Response = Response
    this.Session = Session
    this.Route = Route
    this.middleware = Middleware
    this.static = Static
    this.helpers = Helpers
    this.config = Config
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
  _finalHandler (resolvedRoute, request, response) {
    /**
     * calling request action handler by making a middleware
     * layer of named middleware and finally invoking
     * route action.
     */
    if (resolvedRoute.handler) {
      helpers.callRouteAction(resolvedRoute, request, response, this.middleware, this.helpers.appNameSpace())
      return
    }

    const error = new Error(`Route not found ${request.url()}`)
    error.status = 404
    throw error
  }

  /**
   * @description serves a static resource
   * @method _staticHandler
   * @param  {Object}       request  [description]
   * @param  {Object}       response [description]
   * @return {Promise}                [description]
   * @public
   */
  _staticHandler (request, response) {
    return this.static.serve(request.request, request.response)
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
    const request = new this.Request(req, res, this.config)
    const response = new this.Response(request, res)
    const session = new this.Session(req, res)
    const requestUrl = request.url()
    request.session = session
    this.log.verbose('request on url %s ', req.url)

    /**
     * making request verb/method based upon _method or falling
     * back to original method
     * @type {String}
     */
    const method = request.input('_method', request.method())
    const resolvedRoute = this.Route.resolve(requestUrl, method, request.hostname())
    request._params = resolvedRoute.params

    const finalHandler = function * () {
      self._finalHandler(resolvedRoute, request, response)
    }

    if (method !== 'GET' && method !== 'HEAD') {
      helpers.respondRequest(this.middleware, request, response, finalHandler)
      return
    }

    this._staticHandler(request, response)
    .catch((e) => {
      if (e.status === 404) {
        helpers.respondRequest(this.middleware, request, response, finalHandler)
        return
      }
      helpers.handleRequestError(e, request, response)
    })
  }

  /**
   * starting a server on a given port
   * @param String host
   * @param String port
   * @method listen
   * @return {void}
   */
  listen (host, port) {
    this.log.info('serving app on %s:%s', host, port)
    http.createServer(this.handle.bind(this)).listen(port, host)
  }

}

module.exports = Server
