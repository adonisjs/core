'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const haye = require('haye')
const http = require('http')
const _ = require('lodash')
const { resolver } = require('@adonisjs/fold')
const debug = require('debug')('adonis:framework')
const GE = require('@adonisjs/generic-exceptions')
const Middleware = require('co-compose')

/**
 * Error message when named middleware is not defined
 * but used
 *
 * @method
 *
 * @param  {String} name
 *
 * @return {String}
 */
const missingNamedMiddleware = (name) => {
  return `Cannot find any named middleware for {${name}}. Make sure you have registered it inside start/kernel.js file.`
}

/**
 * Error message when middleware is not a function or
 * string
 *
 * @method
 *
 * @return {String}
 */
const invalidMiddlewareType = () => {
  return 'Middleware must be a function or reference to an IoC container string.'
}

/**
 * Warning to log when duplicate middleware registeration has been
 * found
 *
 * @method
 *
 * @param  {String} type
 * @param  {String} middleware
 *
 * @return {String}
 */
const duplicateMiddlewareWarning = (type, middleware) => {
  return `Detected existing ${type} middleware {${middleware}}, the current one will be ignored`
}

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
    this.Exception = Exception

    this._httpInstance = null

    /**
     * Middleware store
     */
    this._middleware = {
      global: [],
      server: [],
      named: {}
    }
  }

  /**
   * Throws an exception when middleware is not a function or a raw
   * string.
   *
   * @method _ensureRightMiddlewareType
   *
   * @param  {String|Function}                   middleware
   *
   * @return {void}
   *
   * @throws {RuntimeException} If middleware is not a string or a function
   *
   * @private
   */
  _ensureRightMiddlewareType (middleware) {
    if (typeof (middleware) !== 'string' && typeof (middleware) !== 'function') {
      throw GE.RuntimeException.invoke(invalidMiddlewareType(), 500, 'E_INVALID_MIDDLEWARE_TYPE')
    }
  }

  /**
   * Registers an array of middleware for `server` or `global`
   * type.
   *
   * @method _registerMiddleware
   *
   * @param  {String}            type
   * @param  {Array}             middleware
   * @param  {String}            errorMessage
   *
   * @return {void}
   *
   * @private
   */
  _registerMiddleware (type, middleware, errorMessage) {
    if (!Array.isArray(middleware)) {
      throw GE.InvalidArgumentException.invalidParameter(errorMessage, middleware)
    }

    middleware.forEach((item) => {
      if (_.includes(this._middleware[type], item)) {
        this.Logger.warning(duplicateMiddlewareWarning(type, item))
        return
      }
      this._middleware[type].push(item)
    })
  }

  /**
   * Invoked at runtime under the middleware chain. This method will
   * resolve the middleware namespace from the IoC container
   * and invokes it.
   *
   * @method _resolveMiddleware
   *
   * @param  {String|Function} middleware
   * @param  {Array}           options
   *
   * @return {Promise}
   *
   * @private
   */
  _resolveMiddleware (middleware, options) {
    const handlerInstance = resolver.resolveFunc(middleware.namespace)
    const args = options.concat([middleware.params])
    return handlerInstance.method(...args)
  }

  /**
   * Compiles middleware for a certain type to an array of
   * objects, later these objects are used to resolve the
   * middleware and invoke the `handle` function.
   *
   * @method _compileMiddleware
   *
   * @param  {String}           type
   *
   * @return {Array}
   *
   * @example
   * [
   *   {
   *     namespace: 'App/Middleware/Foo.handle',
   *     params: []
   *   }
   * ]
   *
   * @private
   */
  _compileMiddleware (type) {
    return this._middleware[type].map((middleware) => {
      this._ensureRightMiddlewareType(middleware)

      return {
        namespace: typeof (middleware) === 'function' ? middleware : `${middleware}.handle`,
        params: []
      }
    })
  }

  /**
   * Parses a named middleware passed to the route, it will pull the
   * params defined using `pipe(|)` expression.
   *
   * @method _parseMiddlewareName
   *
   * @param  {String}             middleware
   *
   * @return {Array}
   *
   * @throws {RuntimeException} If middleware is not registered under named hash
   *
   * @private
   */
  _parseMiddlewareName (middleware) {
    const [{ name, args: params }] = haye.fromPipe(middleware).toArray()
    const namespace = this._middleware.named[name]
    if (!namespace) {
      throw GE.RuntimeException.invoke(missingNamedMiddleware(name), 500, 'E_MISSING_NAMED_MIDDLEWARE')
    }
    return [namespace, params]
  }

  /**
   * Compiles an array of named middleware by getting their namespace from
   * the named hash
   *
   * @method _compileNamedMiddleware
   *
   * @param  {Array}                namedMiddleware
   *
   * @return {Array}
   *
   * @private
   */
  _compileNamedMiddleware (namedMiddleware) {
    return namedMiddleware.map((middleware) => {
      this._ensureRightMiddlewareType(middleware)

      const [namespace, params] = typeof (middleware) === 'string'
      ? this._parseMiddlewareName(middleware)
      : [middleware, []]

      return {
        namespace: typeof (namespace) === 'function' ? namespace : `${namespace}.handle`,
        params: params
      }
    })
  }

  /**
   * Returns a middleware iterrable by composing server
   * middleware.
   *
   * @method _executeServerMiddleware
   *
   * @param  {Object}                 ctx
   *
   * @return {Promise}
   *
   * @private
   */
  _executeServerMiddleware (ctx) {
    const middleware = this._compileMiddleware('server')
    debug('executing %d server middleware', middleware.length)

    if (!middleware.length) {
      return Promise.resolve()
    }

    return new Middleware()
    .register(middleware)
    .runner()
    .params([ctx])
    .resolve(this._resolveMiddleware.bind(this))
    .run()
  }

  /**
   * Returns a middleware iterrable by composing global and route
   * middleware.
   *
   * @method _executeRouteHandler
   *
   * @param  {Array}                   routeMiddleware
   * @param  {Object}                  ctx
   * @param  {Function}                finalHandler
   *
   * @return {Promise}
   *
   * @private
   */
  _executeRouteHandler (routeMiddleware, ctx, routeHandler) {
    const middleware = this._compileMiddleware('global').concat(this._compileNamedMiddleware(routeMiddleware))
    debug('executing %d global and route middleware', middleware.length)

    return new Middleware()
    .register(middleware)
    .runner()
    .params([ctx])
    .concat([routeHandler])
    .resolve(this._resolveMiddleware.bind(this))
    .run()
  }

  /**
   * Invokes the route handler and uses the return to set the
   * response, only when not set already
   *
   * @method _routeHandler
   *
   * @param  {Object}      ctx
   * @param  {Function}    next
   * @param  {Array}       params
   *
   * @return {Promise}
   *
   * @private
   */
  async _routeHandler (ctx, next, params) {
    const { method } = resolver.forDir('httpControllers').resolveFunc(params[0])
    const returnValue = await method(ctx)

    this._safelySetResponse(ctx.response, returnValue)

    await next()
  }

  /**
   * Pulls the route for the current request. If missing
   * will throw an exception
   *
   * @method _getRoute
   *
   * @param  {Object}  ctx
   *
   * @return {Route}
   *
   * @throws {HttpException} If
   *
   * @private
   */
  _getRoute (ctx) {
    const route = this.Route.match(ctx.request.url(), ctx.request.method(), ctx.request.hostname())

    if (!route) {
      throw new GE.HttpException(`Route not found ${ctx.request.url()}`, 404)
    }

    debug('route found for %s url', ctx.request.url())

    ctx.params = route.params
    ctx.subdomains = route.subdomains
    ctx.request.params = route.params

    return route
  }

  /**
   * Sets the response on the response object, only when it
   * has not been set already
   *
   * @method _safelySetResponse
   *
   * @param  {Object}           ctx
   * @param  {Mixed}            content
   * @param  {String}           method
   *
   * @return {void}
   *
   * @private
   */
  _safelySetResponse (response, content, method = 'send') {
    if (!this._madeSoftResponse(response) && content !== undefined) {
      response.send(content)
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
   * Returns a boolean indicating if a soft response has been made
   *
   * @method _madeSoftResponse
   *
   * @param  {Object}          response
   *
   * @return {Boolean}
   *
   * @private
   */
  _madeSoftResponse (response) {
    return response.lazyBody.content !== undefined && response.lazyBody.content !== null && response.lazyBody.method
  }

  /**
   * Finds if response has already been made, then ends the response
   * by calling `response.end()`
   *
   * @method _evaluateResponse
   *
   * @param  {Object}          response
   *
   * @return {void}
   *
   * @private
   */
  _evaluateResponse (response) {
    if (this._madeSoftResponse(response) && response.isPending) {
      debug('server level middleware ended the response')
      this._endResponse(response)
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
   *   .middleware(['auth'])
   *
   * // Also pass params
   * Route
   *   .get('/profile', 'UserController.profile')
   *   .middleware(['auth:basic'])
   * ```
   */
  registerNamed (middleware) {
    if (!_.isPlainObject(middleware)) {
      throw GE
        .InvalidArgumentException
        .invalidParameter('server.registerNamed accepts a key/value pair of middleware', middleware)
    }

    _.merge(this._middleware.named, middleware)
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
    if (this._httpInstance) {
      throw GE.RuntimeException.invoke('Attempt to hot swap http instance failed. Make sure to call Server.setInstance before starting the http server')
    }
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
    const { request, response } = ctx

    debug('new request on %s url', request.url())

    this._executeServerMiddleware(ctx)
    .then(() => {
      this._evaluateResponse(response)
      if (!response.isPending) {
        debug('ending request within server middleware chain')
        return
      }

      const route = this._getRoute(ctx)
      return this._executeRouteHandler(route.route._middleware, ctx, {
        namespace: this._routeHandler.bind(this),
        params: [route.route._handler]
      })
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
