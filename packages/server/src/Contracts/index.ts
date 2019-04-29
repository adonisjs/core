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
import { RequestContract, RequestConfig } from '@adonisjs/request'
import { ResponseContract, ResponseConfig } from '@adonisjs/response'
import { RouteNode } from '@adonisjs/router'

/**
 * Public server
 */
export interface ServerContract {
  instance?: HttpServer | HttpsServer,
  onError (cb: ErrorHandleNode): this
  handle (req: IncomingMessage, res: ServerResponse): Promise<void>
  optimize (): void
  before (cb: BeforeHookNode): this
  after (cb: AfterHookNode): this
}

/**
 * Context passed to server hooks
 */
export interface HooksHttpContextContract {
  request: RequestContract,
  response: ResponseContract
}

/**
 * Http request context passed to all middleware
 * and route handler
 */
export interface HttpContextContract extends HooksHttpContextContract {
  route: RouteNode,
  params: any,
  subdomains: any,
}

/**
 * Input middleware node must be function or a string pointing
 * to the IoC container
 */
export type MiddlewareNode = ((ctx: HttpContextContract, next: () => Promise<void>) => Promise<void>) | string

/**
 * Before hooks are executed before finding the route or finding
 * middleware
 */
export type BeforeHookNode = (ctx: HttpContextContract) => Promise<void>

/**
 * After hooks are executed after controller has done it's job
 */
export type AfterHookNode = (ctx: HttpContextContract) => Promise<void>

/**
 * Error handler node
 */
export type ErrorHandleNode = (error: any, ctx: HttpContextContract) => Promise<any>

/**
 * Shape of resolved middleware. This information is
 * enough to execute the middleware
 */
export type ResolvedMiddlewareNode = {
  type: string,
  value: any,
  args: string[],
}

/**
 * Node after resolving controller.method binding
 * from the route
 */
export type ResolvedControllerNode = {
  type: string,
  value: any,
  method?: string,
}

/**
 * Shape of middleware store to store and fetch middleware
 * at runtime
 */
export interface MiddlewareStoreContract {
  register (middleware: MiddlewareNode[]): this,
  registerNamed (middleware: { [alias: string]: MiddlewareNode }): this,
  get (): ResolvedMiddlewareNode[],
  getNamed (name: string): null | ResolvedMiddlewareNode,
  routeMiddlewareProcessor (route: any): void,
}

/**
 * Config requried by request and response
 */
export type ServerConfig = RequestConfig & ResponseConfig

/**
 * Request constructor shape
 */
export type RequestConstructor = {
  new (
    req: IncomingMessage,
    res: ServerResponse,
    config: Partial<ServerConfig>,
    secret?: string,
  ): RequestContract,
}

/**
 * Response constructor shape
 */
export type ResponseConstructor = {
  new (
    req: IncomingMessage,
    res: ServerResponse,
    config: Partial<ServerConfig>,
    secret?: string,
  ): ResponseContract,
}
