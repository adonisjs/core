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
declare module '@ioc:Adonis/Core/Config' {
  import { ConfigContract as BaseContract } from '@poppinss/config'
  const Config: ConfigContract

  /**
   * Module exports
   */
  export interface ConfigContract extends BaseContract {}
  export default Config
}
