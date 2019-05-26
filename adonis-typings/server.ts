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
declare module '@ioc:Adonis/Core/Server' {
  import { ServerContract as BaseServerContract } from '@poppinss/http-server'
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

  const Server: ServerContract

  /**
   * Module exports
   */
  export interface ServerContract extends BaseServerContract<HttpContextContract> {}
  export default Server
}
