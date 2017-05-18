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
  constructor (Context, Route, Logger) {
    this.Context = Context
    this.Route = Route
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
      .withParams([ctx])
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
   * @param  {Object}                 ctx
   *
   * @return {Function}
   *
   * @private
   */
  _composeServerMiddleware (ctx) {
    const serverMiddleware = this.middleware.tag('server').get() || []
    const middleware = serverMiddleware.map((middleware) => new MiddlewareWrapper(middleware))

    /**
     * Resolve empty promise when middleware does
     * not exists.
     */
    if (!middleware.length) {
      return () => Promise.resolve()
    }

    return this
      .middleware
      .resolve(this._resolveMiddleware.bind(this))
      .withParams([ctx])
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
  _handleException (error, { response }) {
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
  handle (req, res) {
    const ctx = new this.Context(req, res)
    const response = ctx.response
    const request = ctx.request

    this
      ._composeServerMiddleware(ctx)()
      .then(() => {
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
        ctx.params = route.params
        ctx.subdomains = route.subdomains

        const finalHandler = this._wrapRouteHandler(route.route._handler)
        return this._composeRequestMiddleware(route.route._middleware, finalHandler, ctx)()
      })
      .then(() => {
        if (response.isPending) {
          response.end()
        }
      })
      .catch((error) => {
        this._handleException(error, ctx)
      })
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
