/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/**
 * The binding for the given module is defined inside `providers/AppProvider.ts`
 * file.
 */
declare module '@ioc:Adonis/Core/HttpContext' {
  import { IncomingMessage, ServerResponse } from 'http'
  import { ResponseContract } from '@ioc:Adonis/Core/Response'
  import { RequestContract } from '@ioc:Adonis/Core/Request'
  import { LoggerContract } from '@ioc:Adonis/Core/Logger'
  import { HttpContextContract as BaseContextContract, ServerConfig } from '@poppinss/http-server'

  const HttpContext: HttpContextConstructorContract

  /**
   * Module exports
   */
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

  export default HttpContext
}
