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

    /**
     * Exception handler class to respond
     * to an exception.
     */
    this._ExceptionHandler = null
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
   * Takes middleware as a function or string and returns an object, that
   * can be used at runtime to resolve and run middleware
   *
   * @method _middlewareIdentifierToPacket
   *
   * @param  {String|Function}                      item
   *
   * @return {Object}
   *
   * @private
   */
  _middlewareIdentifierToPacket (item) {
    return {
      namespace: typeof (item) === 'function' ? item : `${item}.handle`,
      params: []
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

    const store = this._middleware[type]

    middleware.forEach((item) => {
      /**
       * Throw exception if middleware is not a string or a function
       */
      this._ensureRightMiddlewareType(item)

      /**
       * Converting middleware identifier { function, string } to an object, which can be
       * used directly to execute middleware.
       */
      const packet = this._middlewareIdentifierToPacket(item)

      /**
       * Show warning for duplicate middleware
       */
      if (store.find((i) => i.namespace === packet.namespace)) {
        this.Logger.warning(duplicateMiddlewareWarning(type, item))
        return
      }

      store.push(packet)
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
   * Compiles an array of named middleware by getting their namespace from
   * the named hash.
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

      if (typeof (middleware) === 'function') {
        return {
          namespace: middleware,
          params: []
        }
      }

      const [{ name, args }] = haye.fromPipe(middleware).toArray()
      const packet = this._middleware.named[name]

      if (!packet) {
        throw GE.RuntimeException.invoke(missingNamedMiddleware(name), 500, 'E_MISSING_NAMED_MIDDLEWARE')
      }

      packet.params = args
      return packet
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
    debug('executing %d server middleware', this._middleware.server)

    if (!this._middleware.server.length) {
      return Promise.resolve()
    }

    return new Middleware()
    .register(this._middleware.server)
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
    const middleware = this._middleware.global.concat(this._compileNamedMiddleware(routeMiddleware))
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
      throw new GE.HttpException(`Route not found ${ctx.request.method()} ${ctx.request.url()}`, 404)
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
   * Finds if response has already been made, then ends the response.
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
   * Handles the exception by invoking `handle` method
   * on the registered exception handler.
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
  async _handleException (error, ctx) {
    error.status = error.status || 500

    try {
      const handler = new this._ExceptionHandler()
      handler.report(error, { request: ctx.request, auth: ctx.auth })
      await handler.handle(error, ctx)
    } catch (error) {
      ctx.response.status(500).send(`${error.name}: ${error.message}\n${error.stack}`)
    }

    this._endResponse(ctx.response)
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

    _.each(middleware, (item, name) => {
      /**
       * Throw exception if middleware is not a string or a function
       */
      this._ensureRightMiddlewareType(item)

      /**
       * Converting middleware identifier { function, string } to an object, which can be
       * used directly to execute middleware.
       */
      this._middleware.named[name] = this._middlewareIdentifierToPacket(item)
    })

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
      throw GE.RuntimeException.invoke('Attempt to hot swap http instance failed. Make sure to call Server.setInstance before starting the http server', 500, 'E_CANNOT_SWAP_SERVER')
    }
    this._httpInstance = httpInstance
  }

  /**
   * Sets the exception handler to be used for handling exceptions
   *
   * @method setExceptionHandler
   *
   * @param  {Class}            handler
   *
   * @return {void}
   */
  setExceptionHandler (handler) {
    if (typeof (handler.prototype.handle) !== 'function' || typeof (handler.prototype.report) !== 'function') {
      throw GE.RuntimeException.invoke('Http exception handler must have handle and report methods on it')
    }
    this._ExceptionHandler = handler
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
      /**
       * We need to find out whether any of the server middleware has
       * ended the response or not.
       *
       * If they did, then simply do not execute the route.
       */
      this._evaluateResponse(response)
      if (!response.isPending) {
        debug('ending request within server middleware chain')
        return
      }

      const route = this._getRoute(ctx)
      return this._executeRouteHandler(route.route.middlewareList, ctx, {
        namespace: this._routeHandler.bind(this),
        params: [route.route.handler]
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

  /**
   * Closes the HTTP server
   *
   * @method close
   *
   * @param  {Function} callback
   *
   * @return {void}
   */
  close (callback) {
    this.getInstance().close(callback)
  }
}

module.exports = Server
