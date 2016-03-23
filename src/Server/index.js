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
const NE = require('node-exceptions')

/**
 * Http server for adonis framework
 * @class
 */
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
   * responds to request by finding registered
   * route or fallbacks to static resource.
   *
   * @param  {Object}      request
   * @param  {Object}      response
   * @return {void}
   *
   * @private
   */
  _finalHandler (resolvedRoute, request, response) {
    if (!resolvedRoute.handler) {
      throw new NE.HttpException(`Route not found ${request.url()}`, 404)
    }

    helpers.callRouteAction(
      resolvedRoute,
      request,
      response,
      this.middleware,
      this.helpers.appNameSpace()
    )
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
    const requestUrl = request.url()
    request.session = session
    this.log.verbose('request on url %s ', req.url)

    /**
     * making request verb/method based upon _method or falling
     * back to original method
     * @type {String}
     */
    const method = this._getRequestMethod(request)
    const resolvedRoute = this.Route.resolve(requestUrl, method, request.hostname())
    request._params = resolvedRoute.params

    const finalHandler = function * () {
      self._finalHandler(resolvedRoute, request, response)
    }

    /**
     * do not serve static resources when request method is not
     * GET or HEAD
     */
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
