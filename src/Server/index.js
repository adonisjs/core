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
const { resolver } = require('@adonisjs/fold')
const debug = require('debug')('adonis:framework')
const GE = require('@adonisjs/generic-exceptions')

const MiddlewareWrapper = require('./MiddlewareWrapper')
const NamedMiddlewareWrapper = require('./NamedMiddlewareWrapper')

/**
 * The HTTP server class to start a new server and bind
 * the entire app around it.
 *
 * This class utilizes the Node.js core HTTP server.
 *
 * @binding Adonis/Src/Server
 * @alias Server
 * @singleton
 * @group Http
 *
 * @class Server
 */
class Server {
  constructor (Context, Route, Logger, Exception) {
    this.Context = Context
    this.Route = Route
    this.Logger = Logger
    this._httpInstance = null
    this.middleware = new Middleware()
    this.Exception = Exception

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
      throw GE.InvalidArgumentException.invalidParameter(errorMessage, middleware)
    }

    const existingMiddleware = this.middleware.tag(tag).get() || []
    const intersections = _.intersection(existingMiddleware, middleware)

    /**
     * Log a warning when duplicate middleware are found
     * and remove them from the middleware list.
     */
    if (_.size(intersections)) {
      this.Logger.warning(
        `Duplicate ${tag} middleware {${intersections.join(',')}} will be discarded and existing one's will be used.`
      )
      _.remove(middleware, (item) => _.includes(intersections, item))
    }

    this.middleware.tag(tag).register(middleware)
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
   *
   * @return {void}
   *
   * @private
   */
  _resolveMiddleware (middleware, params) {
    const handler = typeof (middleware) === 'function' ? middleware : middleware.getHandler()
    const args = typeof (middleware) === 'function' ? params : params.concat(middleware.getArgs())
    const handlerInstance = resolver.resolveFunc(handler)
    return handlerInstance.method(...args)
  }

  /**
   * Composes middleware for a single request by concating global
   * middleware + the route specific named middleware.
   *
   * @method _composeRequestMiddleware
   *
   * @param  {Array}        routeMiddleware
   * @param  {Function}     handler
   * @param  {Object}       ctx
   *
   * @return {Function}
   *
   * @private
   */
  _composeRequestMiddleware (routeMiddleware, handler, ctx) {
    debug('step:3 composing global and route middleware')

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
    debug('step:3.1 executing %d route and global middleware', globalMiddleware.length + namedMiddleware.length)
    const middleware = globalMiddleware.concat(namedMiddleware).concat([handler])

    return this
      .middleware
      .runner(middleware)
      .resolve(this._resolveMiddleware.bind(this))
      .withParams([ctx])
      .compose()
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
   * @param  {Object}                 ctx
   *
   * @return {Function}
   *
   * @private
   */
  _composeServerMiddleware (ctx) {
    debug('step:1 composing server level middleware')
    const serverMiddleware = this.middleware.tag('server').get() || []
    const middleware = serverMiddleware.map((middleware) => new MiddlewareWrapper(middleware))

    /**
     * Resolve empty promise when middleware does
     * not exists.
     */
    if (!middleware.length) {
      return () => Promise.resolve()
    }

    debug('step:1.1 executing %d server level middleware', middleware.length)

    return this
      .middleware
      .runner(middleware)
      .resolve(this._resolveMiddleware.bind(this))
      .withParams([ctx])
      .compose()
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
   *
   * @return {Function}
   *
   * @private
   */
  _wrapRouteHandler (handler) {
    return (ctx, next) => {
      const { method } = resolver.forDir('httpControllers').resolveFunc(handler)
      return Promise
        .resolve(method(ctx))
        .then((value) => {
          if (!ctx.response.lazyBody.content && value) {
            ctx.response.lazyBody.content = value
            ctx.response.lazyBody.method = 'send'
          }
          return next()
        })
    }
  }

  /**
   * End the response only when it's pending
   *
   * @method _endResponse
   *
   * @param  {Object}     response
   *
   * @return {void}
   *
   * @private
   */
  _endResponse (response) {
    if (response.isPending && response.implicitEnd) {
      response.end()
    }
  }

  /**
   * Returns the exception handler to be used for handling
   * the exception.
   *
   * @method _getExceptionHandler
   *
   * @param  {Object}             error
   *
   * @return {Function}
   *
   * @private
   */
  _getExceptionHandler (error) {
    /**
     * First we need to give priority to the manually binded
     * exception handler and `hasHandler` only returns true
     * when there is an explicit handler for that exception.
     */
    const handler = this.Exception.getHandler(error.name, true)
    if (handler) {
      return handler
    }

    /**
     * Next we look for handle method on the exception itself. Yes
     * exceptions can handle themselves.
     */
    if (error.handle) {
      return function (...args) { return error.handle(...args) }
    }

    /**
     * Finally we look for a wildcard handler or fallback
     * to custom method.
     */
    return this.Exception.getWildcardHandler() || function (err, { response }) {
      response.status(error.status).send(`${err.name}: ${err.message}\n${err.stack}`)
    }
  }

  /**
   * Returns exception reporter to be used for reporting
   * the error
   *
   * @method _getExceptionReporter
   *
   * @param  {Object}              error
   *
   * @return {Function}
   *
   * @private
   */
  _getExceptionReporter (error) {
    /**
     * First we need to give priority to the manually binded
     * exception reporter and `hasReporter` only returns true
     * when there is an explicit reporter for that exception.
     */
    const reporter = this.Exception.getReporter(error.name, true)
    if (reporter) {
      return reporter
    }

    /**
     * Next we look for report method on the exception itself. Yes
     * exceptions can report themselves.
     */
    if (error.report) {
      return function (...args) { return error.report(...args) }
    }

    /**
     * Finally we look for a wildcard reporter or return a
     * fallback function
     */
    return this.Exception.getWildcardReporter() || function () {}
  }

  /**
   * Handles the exceptions thrown during the http request
   * life-cycle. It will look for a listener to handle
   * the error, otherwise ends the response by sending
   * the error message
   *
   * @method _handleException
   *
   * @param  {Object}         error
   * @param  {Object}         ctx
   *
   * @return {void}
   *
   * @private
   */
  _handleException (error, ctx) {
    error.message = error.message || 'Internal server error'
    error.status = error.status || 500
    const exceptionHandler = this._getExceptionHandler(error)
    const exceptionReporter = this._getExceptionReporter(error)

    exceptionReporter(error, { request: ctx.request, auth: ctx.auth })

    Promise
      .resolve(exceptionHandler(error, ctx))
      .then(() => {
        this._endResponse(ctx.response)
      })
      .catch((hardError) => {
        // was not expecting this at all
        ctx.response.status(500).send(hardError)
        ctx.response.end()
      })
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
   *
   * @example
   * ```js
   * Server.registerGlobal([
   *   'Adonis/Middleware/BodyParser',
   *   'Adonis/Middleware/Session'
   * ])
   * ```
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
   *
   * @example
   * ```js
   * Server.use(['Adonis/Middleware/Static'])
   * ```
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
   *
   * @example
   * ```js
   * Server.registerNamed({
   *   auth: 'Adonis/Middleware/Auth'
   * })
   *
   * // use it on route later
   * Route
   *   .get('/profile', 'UserController.profile')
   *   .middleware('auth')
   *
   * // Also pass params
   * Route
   *   .get('/profile', 'UserController.profile')
   *   .middleware('auth:basic')
   * ```
   */
  registerNamed (middleware) {
    if (!_.isPlainObject(middleware)) {
      throw GE
        .InvalidArgumentException
        .invalidParameter('server.registerNamed accepts a key/value pair of middleware', middleware)
    }

    this._registerMiddleware('named', _.keys(middleware), '')
    _.merge(this._namedHash, middleware)
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
   *
   * @example
   * ```js
   * const https = require('https')
   * Server.setInstance(https)
   * ```
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
  handle (req, res) {
    const ctx = new this.Context(req, res)
    const response = ctx.response
    const request = ctx.request

    debug('new request on %s url', request.url())

    this
      ._composeServerMiddleware(ctx)()
      .then(() => {
        /**
         * If any server level middleware ends the response, there is no
         * need of executing the route or global middleware.
         */
        if (!response.isPending) {
          debug('step:1.2 server level middleware ended the response explicitly by calling end')
          return
        }

        /**
         * If server level middleware sets the response content
         * or statusCode to 204, end the request right away
         */
        if ((response.lazyBody.content || response.response.statusCode === 204) && response.lazyBody.method) {
          debug('step:1.2 server level middleware ended the response')
          response.end()
          return
        }

        const route = this.Route.match(request.url(), request.method(), request.hostname())

        /**
         * Throw 404 exception when route is not found
         */
        if (!route) {
          throw new GE.HttpException(`Route not found ${request.url()}`, 404)
        }

        /**
         * Setting up params as the private
         * property on middleware
         *
         * @type {Object}
         */
        ctx.params = route.params
        ctx.subdomains = route.subdomains
        request.params = route.params
        debug('step:2 route found for %s url', request.url())

        const finalHandler = this._wrapRouteHandler(route.route._handler)
        return this._composeRequestMiddleware(route.route._middleware, finalHandler, ctx)()
      })
      .then(() => {
        debug('ending response for %s url', request.url())
        this._endResponse(response)
      })
      .catch((error) => {
        debug('received error on %s url', request.url())
        this._handleException(error, ctx)
      })
  }

  /**
   * Listen on given host and port.
   *
   * @method listen
   *
   * @param  {String}   [host = localhost]
   * @param  {Number}   [port = 3333]
   * @param  {Function} [callback]
   *
   * @return {Object}
   */
  listen (host = 'localhost', port = 3333, callback) {
    this.Logger.info('serving app on http://%s:%s', host, port)
    return this.getInstance().listen(port, host, callback)
  }
}

module.exports = Server
