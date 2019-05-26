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
declare module '@ioc:Adonis/Core/Response' {
  import { ServerResponse, IncomingMessage } from 'http'
  import { MacroableConstructorContract } from 'macroable'
  import { ResponseContract as BaseContract } from '@poppinss/response'
  import { ResponseConfigContract as BaseConfig } from '@poppinss/response'

  /**
   * The `appKey` is used in place of `secret`. So we need to remove it from the
   * response config block
   */
  type ResponseConfigContract = Pick<BaseConfig, Exclude<keyof BaseConfig, 'secret'>>
  const Response: ResponseConstructorContract

  /**
   * Module exports
   */
  export interface ResponseContract extends BaseContract {}
  export interface ResponseConstructorContract extends MacroableConstructorContract {}
  export { ResponseConfigContract }
  export default Response
}
