/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Server as HttpsServer } from 'https'
import { IncomingMessage, ServerResponse, Server as HttpServer } from 'http'
import { RouterContract } from '@adonisjs/router'
import { Middleware } from 'co-compose'
import { Exception } from '@adonisjs/utils'

import { HttpContext } from './HttpContext'
import { middlewareExecutor } from './middlewareExecutor'
import { exceptionCodes } from '../lib'

import {
  ServerContract,
  MiddlewareStoreContract,
  RequestConstructor,
  ResponseConstructor,
  ServerConfig,
  BeforeHookNode,
  AfterHookNode,
  HttpContextContract,
  ErrorHandleNode,
} from './Contracts'

class RouteNotFound extends Exception {}

/**
 * Server class handles the HTTP requests by using all Adonis micro modules.
 *
 * ```js
 * const http = require('http')
 * const { Request } = require('@adonisjs/request')
 * const { Response } = require('@adonisjs/response')
 * const { Router } = require('@adonisjs/router')
 * const { MiddlewareStore, Server, routePreProcessor } = require('@adonisjs/server')
 *
 * const middlewareStore = new MiddlewareStore()
 * const router = new Router((route) => routePreProcessor(route, middlewareStore))
 *
 * const server = new Server(Request, Response, router, middlewareStore)
 * http.createServer(server.handle.bind(server)).listen(3000)
 * ```
 */
export class Server implements ServerContract {
  /**
   * Hooks to be executed before and after the request
   */
  private _hooks: {
    before: BeforeHookNode[],
    after: AfterHookNode[],
  } = {
    before: [],
    after: [],
  }

  /**
   * Caching the handler based upon the existence of global middleware,
   * hooks and error handler.
   */
  private _globalMiddleware

  /**
   * Hooks handler value is decided by [[Server.optimize]] method.
   */
  private _hooksHandler

  /**
   * Route handler is called on every request. The actual of this var depends
   * upon certain factors. Check [[Server.optimize]] for same.
   */
  private _routeHandler

  /**
   * Value of error handler is again decided inside [[Server.optimize]] method.
   */
  private _errorHandler: ErrorHandleNode

  /**
   * The server itself doesn't create the http server instance. However, the consumer
   * of this class can create one and set the instance for further reference. This
   * is what ignitor does.
   */
  public instance?: HttpServer | HttpsServer

  constructor (
    private _Request: RequestConstructor,
    private _Response: ResponseConstructor,
    private _router: RouterContract,
    private _middlewareStore: MiddlewareStoreContract,
    private _httpConfig: Partial<ServerConfig>,
  ) {}

  /**
   * Executes the global middleware chain before executing
   * the route handler
   */
  private async _executeMiddleware (ctx: HttpContextContract) {
    await this
      ._globalMiddleware
      .runner()
      .resolve(middlewareExecutor)
      .finalHandler(ctx.route.meta.finalHandler, [ctx])
      .run([ctx])
  }

  /**
   * Executes route handler directly without executing
   * the middleware chain. This is used when global
   * middleware length is 0
   */
  private async _executeFinalHandler (ctx: HttpContextContract) {
    await ctx.route.meta.finalHandler(ctx)
  }

  /**
   * Executes before hooks and then the route handler
   */
  private async _executeHooksAndHandler (ctx: HttpContextContract) {
    const shortcircuit = await this._executeBeforeHooks(ctx)
    if (!shortcircuit) {
      await this._handleRequest(ctx)
    }
  }

  /**
   * Handles HTTP request
   */
  private async _handleRequest (ctx: HttpContextContract) {
    const url = ctx.request.url()
    const method = ctx.request.method()

    /**
     * Raise error when route is missing
     */
    const route = this._router.find(url, method)
    if (!route) {
      throw new RouteNotFound(`Cannot ${method}:${url}`, 404, exceptionCodes.E_ROUTE_NOT_FOUND)
    }

    /**
     * Attach `params`, `subdomains` and `route` when route is found. This
     * information only exists on a given route
     */
    ctx.params = route.params
    ctx.subdomains = route.subdomains
    ctx.route = route.route

    await this._routeHandler(ctx)
  }

  /**
   * Executing before hooks. If this method returns `true`, it means that
   * one of the before hooks wants to end the request without further
   * processing it.
   */
  private async _executeBeforeHooks (ctx: HttpContextContract): Promise<boolean> {
    for (let hook of this._hooks.before) {
      await hook(ctx)
      if (ctx.response.hasLazyBody || ctx.response.headersSent) {
        return true
      }
    }

    return false
  }

  /**
   * Handles error raised during HTTP request
   */
  private _handleError (error: any, ctx: HttpContextContract) {
    ctx.response.status(error.status || 500).send(error.message)
  }

  /**
   * Executing after hooks
   */
  private async _executeAfterHooks (ctx: HttpContextContract): Promise<void> {
    for (let hook of this._hooks.after) {
      await hook(ctx)
    }
  }

  /**
   * Define hooks to be executed as soon as a new request
   * has been received
   */
  public before (cb: BeforeHookNode): this {
    this._hooks.before.push(cb)
    return this
  }

  /**
   * Define hooks to be executed after the route handler
   */
  public after (cb: AfterHookNode): this {
    this._hooks.after.push(cb)
    return this
  }

  /**
   * Define custom error handler to handler all errors
   * occurred during HTTP request
   */
  public onError (cb: ErrorHandleNode): this {
    this._errorHandler = cb
    return this
  }

  /**
   * Optimizes internal handlers, based upon the existence of
   * before handlers and global middleware. This helps in
   * increasing throughput by 10%
   */
  public optimize () {
    /**
     * Choose the correct route handler based upon existence
     * of global middleware
     */
    if (this._middlewareStore.get().length) {
      this._globalMiddleware = new Middleware().register(this._middlewareStore.get())
      this._routeHandler = this._executeMiddleware.bind(this)
    } else {
      this._routeHandler = this._executeFinalHandler.bind(this)
    }

    /**
     * Choose correct hooks handler, based upon existence
     * of before hooks
     */
    if (this._hooks.before.length) {
      this._hooksHandler = this._executeHooksAndHandler.bind(this)
    } else {
      this._hooksHandler = this._handleRequest.bind(this)
    }

    /**
     * Set final error handler
     */
    if (typeof (this._errorHandler) !== 'function') {
      this._errorHandler = this._handleError.bind(this)
    }
  }

  /**
   * Handles a given HTTP request. This method can be attached to any HTTP
   * server
   */
  public async handle (req: IncomingMessage, res: ServerResponse): Promise<void> {
    const request = new this._Request(req, res, this._httpConfig)
    const response = new this._Response(req, res, this._httpConfig)
    response.explicitEnd = true

    const ctx = new HttpContext(request, response)

    /**
     * Start with before hooks upfront. If they raise error
     * then execute error handler.
     */
    try {
      await this._hooksHandler(ctx)
    } catch (error) {
      await this._errorHandler(error, ctx)
    }

    /**
     * Execute after hooks when explictEnd is true and their are
     * more than zero after hooks.
     */
    if (ctx.response.explicitEnd && this._hooks.after.length) {
      try {
        await this._executeAfterHooks(ctx)
      } catch (error) {
        await this._errorHandler(error, ctx)
      }
    }

    ctx.response.finish()
  }
}
