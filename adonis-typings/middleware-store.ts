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
declare module '@ioc:Adonis/Src/MiddlewareStore' {
  import { MiddlewareStoreContract as BaseMiddlewareContract } from '@poppinss/http-server'
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

  const MiddlewareStore: MiddlewareStoreContract

  /**
   * Module exports
   */
  export interface MiddlewareStoreContract extends BaseMiddlewareContract<HttpContextContract> {}
  export default MiddlewareStore
}
