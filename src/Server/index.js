'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const http = require('http')
const _ = require('lodash')
const Middleware = require('co-compose')
const { resolver } = require('adonis-fold')

const MiddlewareWrapper = require('./MiddlewareWrapper')
const NamedMiddlewareWrapper = require('./NamedMiddlewareWrapper')
const CE = require('../Exceptions')

/**
 * @class Server
 */
class Server {
  constructor (Request, Response, Route, Logger, Config) {
    this.Request = Request
    this.Response = Response
    this.Route = Route
    this.Config = Config
    this.Logger = Logger
    this._httpInstance = null
    this.middleware = new Middleware()

    /**
     * The keys for named middleware are stored on the
     * middleware store and here we store the actual
     * named hash to resolve middleware value for
     * a given key
     *
     * @type {Object}
     */
    this._namedHash = {}
  }

  /**
   * Registers an array of middleware for a given tag. This
   * method DRY the code of registering middleware of
   * same nature but with different tag names.
   *
   * @method _registerMiddleware
   *
   * @param  {String}            tag
   * @param  {Array}             middleware
   * @param  {String}            errorMessage
   *
   * @return {void}
   *
   * @private
   */
  _registerMiddleware (tag, middleware, errorMessage) {
    if (!Array.isArray(middleware)) {
      throw CE.InvalidArgumentException.invalidParamter(errorMessage, middleware)
    }

    const existingMiddleware = this.middleware.tag(tag).get() || []
    const intersections = _.intersection(existingMiddleware, middleware)

    /**
     * Log a warning when duplicate middleware are found
     * and remove them from the middleware list.
     */
    if (_.size(intersections)) {
      this.Logger.warn(
        `Duplicate ${tag} middleware {${intersections.join(',')}} will be discarded and existing one's will be used.`
      )
      _.remove(middleware, (item) => _.includes(intersections, item))
    }

    this.middleware.tag(tag).register(middleware)
  }

  /**
   * Makes the instance of route handler by resolving it from
   * the IoC container when it is a reference string or
   * returning the closure with a custom scope bind
   * to it.
   *
   * @method _makeHandlerInstance
   *
   * @param  {Function|String}    handler
   * @param  {Object}             request
   * @param  {Object}             response
   * @param  {String}             [handlerFor = null]
   *
   * @return {Object}
   *
   * @private
   */
  _makeHandlerInstance (handler, request, response, handlerFor = null) {
    const handlerInstance = handlerFor
    ? resolver.forDir(handlerFor).resolveFunc(handler)
    : resolver.resolveFunc(handler)

    /**
     * Bind instance to the handler when it does exists already.
     * Usally closures do not have instance.
     */
    if (!handlerInstance.instance) {
      handlerInstance.instance = {}
    }

    /**
     * Set request and response properties on the handler
     * instance
     */
    handlerInstance.instance.request = request
    handlerInstance.instance.response = response
    return handlerInstance
  }

  /**
   * Resolve middleware when it is getting composed. Each middleware
   * will have access to `request` and `response` objects and should
   * call `next` to advance the middleware chain.
   *
   * @method _resolveMiddleware
   *
   * @param  {Object}           middleware
   * @param  {Object}           params
   * @param  {Function}         next
   *
   * @return {void}
   *
   * @private
   */
  _resolveMiddleware (middleware, [request, response, next]) {
    const handler = typeof (middleware) === 'function' ? middleware : middleware.getHandler()
    const args = typeof (middleware) === 'function' ? [next] : [next].concat(middleware.getArgs())
    const handlerInstance = this._makeHandlerInstance(handler, request, response)
    return handlerInstance.method.bind(handlerInstance.instance)(...args)
  }

  /**
   * Composes middleware for a single request by concating global
   * middleware + the route specific named middleware.
   *
   * @method _composeRequestMiddleware
   *
   * @param  {Array}        routeMiddleware
   * @param  {Function}     handler
   * @param  {Array}        params
   *
   * @return {Function}
   *
   * @private
   */
  _composeRequestMiddleware (routeMiddleware, handler, params) {
    let globalMiddleware = this.middleware.tag('global').get() || []

    /**
     * Wrapping global middleware inside a middleware wrapper, which
     * returns the actual middleware namespace.method.
     */
    globalMiddleware = globalMiddleware.map((middleware) => new MiddlewareWrapper(middleware))

    /**
     * Wrapping named middleware inside a middleware wrapper, which will
     * process the middleware name, extract runtime params from it,
     * and returns the right namespace for the name.
     */
    const namedMiddleware = routeMiddleware
      .map((middleware) => new NamedMiddlewareWrapper(middleware, this._namedHash))

    /**
     * Final list in the right sequence. Starting from
     * 1. Global middleware
     * 2. Named middleware ( route specific )
     * 3. The route handler ( known as finalHandler )
     */
    const middleware = globalMiddleware.concat(namedMiddleware).concat([handler])

    return this
      .middleware
      .resolve(this._resolveMiddleware.bind(this))
      .withParams(params)
      .compose(middleware)
  }

  /**
   * Composes server level middleware. These middleware
   * are called regardless whether a route for a
   * specific request has been found or not.
   *
   * A good example of server middleware is to serve
   * static assets
   *
   * @method _composeServerMiddleware
   *
   * @param  {Array}                 params
   *
   * @return {Function}
   *
   * @private
   */
  _composeServerMiddleware (params) {
    const serverMiddleware = this.middleware.tag('server').get() || []
    const middleware = serverMiddleware.map((middleware) => new MiddlewareWrapper(middleware))

    return this
      .middleware
      .resolve(this._resolveMiddleware.bind(this))
      .withParams(params)
      .compose(middleware)
  }

  /**
   * Wraps the route handler inside a function which is passed
   * to the middleware layer as the last middleware. It is
   * done since we allow route handlers to return a value
   * + it is not required to call `next` within the route
   * handler.
   *
   * @method _wrapRouteHandler
   *
   * @param  {Function|String}  handler
   * @param  {Object}           request
   * @param  {Object}           response
   *
   * @return {Function}
   *
   * @private
   */
  _wrapRouteHandler (handler, request, response) {
    const { instance, method } = this._makeHandlerInstance(handler, request, response, 'httpControllers')
    return async function (next) {
      const params = _.values(this.request._params)
      const value = await method.bind(instance)(...params)
      this.response.lazyBody.content = response.lazyBody.content || value || null
      this.response.lazyBody.method = response.lazyBody.method || 'send'
      await next()
    }
  }

  /**
   * Handles the exceptions thrown during the http request
   * life-cycle. It will look for a listener to handle
   * the error, otherwise ends the response by sending
   * the error message
   *
   * @method _handleExpection
   *
   * @param  {Object}         error
   * @param  {Object}         request
   * @param  {Object}         response
   *
   * @return {void}
   *
   * @private
   */
  _handleExpection (error, request, response) {
    error.message = error.message || 'Internal server error'
    error.status = error.status || 500
    response.status(error.status || 500).send(`${error.name}: ${error.message}\n${error.stack}`)
    response.end()
  }

  /**
   * Register an array of global middleware to be called
   * for each route. If route does not exists, middleware
   * will never will called.
   *
   * Calling this method multiple times will concat to the
   * existing list
   *
   * @method registerGlobal
   *
   * @param  {Array}       middleware
   *
   * @chainable
   *
   * @throws {InvalidArgumentException} If middleware is not an array
   */
  registerGlobal (middleware) {
    this._registerMiddleware('global', middleware, 'server.registerGlobal accepts an array of middleware')
    return this
  }

  /**
   * Register server middleware to be called no matter
   * whether a route has been registered or not. The
   * great example is a middleware to serve static
   * resources from the `public` directory.
   *
   * @method use
   *
   * @param  {Array} middleware
   *
   * @chainable
   *
   * @throws {InvalidArgumentException} If middleware is not an array
   */
  use (middleware) {
    this._registerMiddleware('server', middleware, 'server.use accepts an array of middleware')
    return this
  }

  /**
   * Register named middleware. Calling this method for
   * multiple times will concat to the existing list.
   *
   * @method registerNamed
   *
   * @param  {Object}      middleware
   *
   * @chainable
   *
   * @throws {InvalidArgumentException} If middleware is not an object with key/value pair.
   */
  registerNamed (middleware) {
    if (!_.isPlainObject(middleware)) {
      throw CE.InvalidArgumentException.invalidParamter('server.registerNamed accepts a key/value pair of middleware', middleware)
    }

    this._registerMiddleware('named', _.keys(middleware), '')
    this._namedHash = middleware
    return this
  }

  /**
   * Returns the http server instance. Also one can set
   * a custom http instance.
   *
   * @method getInstance
   *
   * @return {Object}
   */
  getInstance () {
    if (!this._httpInstance) {
      this._httpInstance = http.createServer(this.handle.bind(this))
    }

    return this._httpInstance
  }

  /**
   * Set a custom http instance instead of using
   * the default one
   *
   * @method setInstance
   *
   * @param  {Object}    httpInstance
   *
   * @return {void}
   */
  setInstance (httpInstance) {
    this._httpInstance = httpInstance
  }

  /**
   * Handle method executed for each HTTP request and handles
   * the request lifecycle by performing following operations.
   *
   * 1. Call server level middleware
   * 2. Resolve route
   * 3. Call global middleware
   * 4. Call route middleware
   * 5. Execute route handler.
   *
   * Also if route is not found. All steps after that are not
   * executed and 404 exception is thrown.
   *
   * @method handle
   * @async
   *
   * @param  {Object} req
   * @param  {Object} res
   *
   * @return {void}
   */
  async handle (req, res) {
    const request = new this.Request(req, res, this.Config)
    const response = new this.Response(req, res)
    const params = [request, response]

    try {
      await this._composeServerMiddleware(params)()

      /**
       * If any server level middleware ends the response, there is no
       * need of executing the route or global middleware.
       */
      if (response.lazyBody.content && response.lazyBody.method && response.isPending) {
        response.end()
        return
      }

      const route = this.Route.match(request.url(), request.method(), request.hostname())

      /**
       * Throw 404 exception when route is not found
       */
      if (!route) {
        throw new CE.HttpException(`Route not found ${request.url()}`, 404)
      }

      /**
       * Setting up params as the private
       * property on middleware
       *
       * @type {Object}
       */
      request._params = route.params

      const finalHandler = this._wrapRouteHandler(route.route._handler, request, response)
      await this._composeRequestMiddleware(route.route._middleware, finalHandler, params)()

      /**
       * End the response only when it has not been ended
       * so far.
       */
      if (response.isPending) {
        response.end()
      }
    } catch (error) {
      this._handleExpection(error, request, response)
    }
  }

  /**
   * Listen on given host and port.
   *
   * @method listen
   *
   * @param  {String} [host = localhost]
   * @param  {Number} [port = 3333]
   *
   * @return {Object}
   */
  listen (host = 'localhost', port = 3333) {
    this.Logger.info('serving app on %s:%s', host, port)
    return this.getInstance().listen(port, host)
  }
}

module.exports = Server
