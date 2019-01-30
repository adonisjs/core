/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { RouterContract } from '@adonisjs/router'
import { Middleware } from 'co-compose'
import { Exception } from '@adonisjs/utils'

import { Context } from './Context'
import { middlewareExecutor } from './middlewareExecutor'
import {
  ServerContract,
  MiddlewareStoreContract,
  RequestConstructor,
  ResponseConstructor,
  ServerConfig,
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
  private _globalMiddleware = new Middleware().register(this._middlewareStore.get())

  private _handler = this._middlewareStore.get().length
    ? this._executeMiddleware.bind(this)
    : this._executeRouteHandler.bind(this)

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
  private async _executeMiddleware (ctx) {
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
  private async _executeRouteHandler (ctx) {
    await ctx.route.meta.finalHandler(ctx)
  }

  /**
   * Handles HTTP request
   */
  private async _handleRequest (ctx) {
    const url = ctx.request.url()
    const method = ctx.request.method()

    /**
     * Raise error when route is missing
     */
    const route = this._router.find(url, method)
    if (!route) {
      throw new RouteNotFound(`Cannot ${method}:${url}`, 404, 'E_ROUTE_NOT_FOUND')
    }

    /**
     * Attach `params`, `subdomains` and `route` when route is found. This
     * information only exists on a given route
     */
    ctx.params = route.params
    ctx.subdomains = route.subdomains
    ctx.route = route.route

    await this._handler(ctx)
  }

  /**
   * Handles a given HTTP request. This method can be attached to any HTTP
   * server
   */
  public async handle (req: IncomingMessage, res: ServerResponse): Promise<void> {
    const request = new this._Request(req, res, this._httpConfig)
    const response = new this._Response(req, res, this._httpConfig)
    response.explicitEnd = true

    const ctx = new Context(request, response)

    try {
      await this._handleRequest(ctx)
    } catch (error) {
      ctx.response.status(error.status || 500).send(error.message)
    }

    ctx.response.finish()
  }
}
