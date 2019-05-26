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
declare module '@ioc:Adonis/Core/Request' {
  import { IncomingMessage, ServerResponse } from 'http'
  import { MacroableConstructorContract } from 'macroable'
  import { RequestContract as BaseContract } from '@poppinss/request'
  import { RequestConfigContract as BaseConfig } from '@poppinss/request'

  /**
   * The `appKey` is used in place of `secret`. So we need to remove it from the
   * request config block
   */
  type RequestConfigContract = Pick<BaseConfig, Exclude<keyof BaseConfig, 'secret'>>
  const Request: RequestConstructorContract

  /**
   * Module exports
   */
  export interface RequestContract extends BaseContract {}
  export interface RequestConstructorContract extends MacroableConstructorContract {}
  export { RequestConfigContract }
  export default Request
}
