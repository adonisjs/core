/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Src/Request' {
  import { IncomingMessage, ServerResponse } from 'http'
  import { MacroableConstructorContract } from 'macroable'
  import {
    RequestContract as BaseContract,
    RequestConfigContract as BaseConfig,
  } from '@poppinss/request'

  export interface RequestContract extends BaseContract {}
  export interface RequestConstructorContract extends MacroableConstructorContract {}

  type RequestConfigContract = Pick<BaseConfig, Exclude<keyof BaseConfig, 'secret'>>
  export { RequestConfigContract }

  const Request: RequestConstructorContract
  export default Request
}

declare module '@ioc:Adonis/Src/Response' {
  import { ServerResponse, IncomingMessage } from 'http'
  import { MacroableConstructorContract } from 'macroable'
  import {
    ResponseContract as BaseContract,
    ResponseConfigContract as BaseConfig,
  } from '@poppinss/response'

  export interface ResponseContract extends BaseContract {}
  export interface ResponseConstructorContract extends MacroableConstructorContract {}

  type ResponseConfigContract = Pick<BaseConfig, Exclude<keyof BaseConfig, 'secret'>>
  export { ResponseConfigContract }

  /**
   * The IoC container must export the Response class and not it's instance.
   * The instances are meant to created during HTTP request
   */
  const Response: ResponseConstructorContract
  export default Response
}

declare module '@ioc:Adonis/Src/Config' {
  import { ConfigContract as BaseContract } from '@poppinss/config/contracts'
  export interface ConfigContract extends BaseContract {}

  const Config: ConfigContract
  export default Config
}

declare module '@ioc:Adonis/Src/Env' {
  import { EnvContract as BaseContract } from '@poppinss/env/contracts'
  export interface EnvContract extends BaseContract {}

  const Env: EnvContract
  export default Env
}

declare module '@ioc:Adonis/Src/Logger' {
  import { LoggerContract as BaseContract, LoggerConfigContract } from '@poppinss/logger/contracts'

  export interface LoggerContract extends BaseContract {}
  export { LoggerConfigContract }

  const Logger: LoggerContract
  export default Logger
}

declare module '@ioc:Adonis/Src/HttpContext' {
  import { HttpContextContract as BaseContextContract, ServerConfig } from '@poppinss/http-server/contracts'
  import { ResponseContract } from '@ioc:Adonis/Src/Response'
  import { RequestContract } from '@ioc:Adonis/Src/Request'
  import { LoggerContract } from '@ioc:Adonis/Src/Logger'
  import { IncomingMessage, ServerResponse } from 'http'

  export interface HttpContextContract extends BaseContextContract {
    response: ResponseContract,
    request: RequestContract,
    logger: LoggerContract,
  }

  export interface HttpContextConstructorContract {
    create (
      routePattern: string,
      routeParams: any,
      req?: IncomingMessage,
      res?: ServerResponse,
      serverConfig?: ServerConfig,
    ): HttpContextContract
  }

  const HttpContext: HttpContextConstructorContract
  export default HttpContext
}

/**
 * Router module, this is one of the most involved pieces of
 * this codebase.
 */
declare module '@ioc:Adonis/Src/Route' {
  import {
    RouteContract as BaseRouteContract,
    RouteGroupContract as BaseGroupContract,
    RouteResourceContract as BaseResourceContract,
    BriskRouteContract as BaseBriskContract,
    RouterContract as BaseRouterContract,
  } from '@poppinss/http-server/contracts'

  import { HttpContextContract } from '@ioc:Adonis/Src/HttpContext'

  export interface RouteContract extends BaseRouteContract<HttpContextContract> {}
  export interface RouteGroupContract extends BaseGroupContract<HttpContextContract> {}
  export interface RouteResourceContract extends BaseResourceContract<HttpContextContract> {}
  export interface BriskRouteContract extends BaseBriskContract<HttpContextContract> {}

  export interface RouterContract extends BaseRouterContract<
    HttpContextContract,
    RouteContract,
    RouteGroupContract,
    RouteResourceContract,
    BriskRouteContract
  > {}

  const Route: RouterContract
  export default Route
}

/**
 * Http server module
 */
declare module '@ioc:Adonis/Src/Server' {
  import { ServerContract as BaseServerContract } from '@poppinss/http-server/contracts'
  import { HttpContextContract } from '@ioc:Adonis/Src/HttpContext'

  export interface ServerContract extends BaseServerContract<HttpContextContract> {}
  const Server: ServerContract

  export default Server
}

/**
 * Middleware store contract to register middleware
 */
declare module '@ioc:Adonis/Src/MiddlewareStore' {
  import { MiddlewareStoreContract as BaseMiddlewareContract } from '@poppinss/http-server/contracts'
  import { HttpContextContract } from '@ioc:Adonis/Src/HttpContext'

  export interface MiddlewareStoreContract extends BaseMiddlewareContract<HttpContextContract> {}
  const MiddlewareStore: MiddlewareStoreContract

  export default MiddlewareStore
}

/**
 * Added to container inside `providers/AppProvider.ts` file.
 */
declare module '@ioc:Adonis/Src/HttpExceptionHandler' {
  import { HttpContextContract } from '@ioc:Adonis/Src/HttpContext'
  import { LoggerContract } from '@ioc:Adonis/Src/Logger'

  export default abstract class HttpExceptionHandler {
    protected logger: LoggerContract
    protected dontReport: string[]
    protected ignoreStatuses: number[]
    protected internalDontReport: string[]
    protected context (ctx: HttpContextContract): any
    protected shouldReport (error: any): boolean
    protected makeJSONResponse (error: any, ctx: HttpContextContract): Promise<void>
    protected makeHtmlResponse (error: any, ctx: HttpContextContract): Promise<void>
    public report (error: any, ctx: HttpContextContract): void
    public handle (error: any, ctx: HttpContextContract): Promise<any>
  }
}
