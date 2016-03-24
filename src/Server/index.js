'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const CatLog = require('cat-log')
const helpers = require('./helpers')
const http = require('http')
const co = require('co')
const NE = require('node-exceptions')

/**
 * Http server for adonis framework
 * @class
 */
class Server {

  constructor (Request, Response, Route, Helpers, Middleware, Static, Session, Config, Event) {
    this.Request = Request
    this.Response = Response
    this.Session = Session
    this.route = Route
    this.middleware = Middleware
    this.static = Static
    this.helpers = Helpers
    this.config = Config
    this.event = Event
    this.log = new CatLog('adonis:framework')
  }

  /**
   * responds to a given http request by calling all global
   * middleware and finally executing the route action.
   *
   * @param  {Object} request
   * @param  {Object} response
   * @param  {Function} finalHandler
   *
   * @private
   */
  _respond (request, response, finalHandler) {
    const action = helpers.makeRequestAction(this.middleware, finalHandler)
    this._executeCo(action, request, response)
  }

  /**
   * responds to request by finding registered
   * route or throwing 404 error
   *
   * @param  {Object}      request
   * @param  {Object}      response
   * @throws {HttpException} If there is not registered route action
   *
   * @private
   */
  _callRouteAction (resolvedRoute, request, response) {
    if (!resolvedRoute.handler) {
      throw new NE.HttpException(`Route not found ${request.url()}`, 404)
    }
    const action = helpers.makeRouteAction(resolvedRoute, this.middleware, this.helpers.appNameSpace())
    this._executeCo(action, request, response)
  }

  /**
   * handles any errors thrown with in a given request
   * and emit them using the Event provider.
   *
   * @param  {Object}     error
   * @param  {Object}     request
   * @param  {Object}     response
   *
   * @private
   */
  _handleError (error, request, response) {
    const status = error.status || 500
    if (this.event.wildcard() && this.event.hasListeners(['Http', '*'])) {
      this.event.fire(['Http', status], error, request, response)
      return
    }
    if (!this.event.wildcard() && this.event.hasListeners(['Http', 'error'])) {
      this.event.fire(['Http', 'error'], error, request, response)
      return
    }
    const message = error.message || 'Internal server error'
    const stack = error.stack || message
    this.log.error(stack)
    response.status(status).send(stack)
  }

  /**
   * executes an array of actions by composing them
   * using middleware provider.
   *
   * @param  {Array}    handlers
   * @param  {Object}   request
   * @param  {Object}   response
   *
   * @private
   */
  _executeCo (handlers, request, response) {
    const middleware = this.middleware
    co(function * () {
      yield middleware.compose(handlers, request, response)
    }).catch((e) => {
      this._handleError(e, request, response)
    })
  }

  /**
   * serves static resource using static server
   *
   * @param  {Object}       request
   * @param  {Object}       response
   * @return {Promise}
   *
   * @private
   */
  _staticHandler (request, response) {
    return this.static.serve(request.request, request.response)
  }

  /**
   * returns request method by spoofing the _method only
   * if allowed by the applicatin
   *
   * @param  {Object}          request
   * @return {String}
   *
   * @private
   */
  _getRequestMethod (request) {
    if (!this.config.get('app.http.allowMethodSpoofing')) {
      return request.method().toUpperCase()
    }
    return request.input('_method', request.method()).toUpperCase()
  }

  /**
   * request handler to respond to a given http request
   *
   * @param  {Object} req
   * @param  {Object} res
   *
   * @example
   * http
   *   .createServer(Server.handle.bind(Server))
   *   .listen(3333)
   *
   * @public
   */
  handle (req, res) {
    const self = this
    const request = new this.Request(req, res, this.config)
    const response = new this.Response(request, res)
    const session = new this.Session(req, res)
    request.session = session
    this.log.verbose('request on url %s ', request.originalUrl())

    /**
     * making request verb/method based upon _method or falling
     * back to original method
     * @type {String}
     */
    const method = this._getRequestMethod(request)
    const resolvedRoute = this.route.resolve(request.url(), method, request.hostname())
    request._params = resolvedRoute.params

    const finalHandler = function * () {
      self._callRouteAction(resolvedRoute, request, response)
    }

    /**
     * do not serve static resources when request method is not
     * GET or HEAD
     */
    if (method !== 'GET' && method !== 'HEAD') {
      this._respond(request, response, finalHandler)
      return
    }

    this._staticHandler(request, response)
    .catch((e) => {
      if (e.status === 404) {
        this._respond(request, response, finalHandler)
        return
      }
      this._handleError(e, request, response)
    })
  }

  /**
   * starting a server on a given port and host
   *
   * @param {String} host
   * @param {String} port
   *
   * @example
   * Server.listen('localhost', 3333)
   *
   * @public
   */
  listen (host, port) {
    this.log.info('serving app on %s:%s', host, port)
    http.createServer(this.handle.bind(this)).listen(port, host)
  }

}

module.exports = Server
