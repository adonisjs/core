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
declare module '@ioc:Adonis/Core/Env' {
  import { EnvContract as BaseContract } from '@poppinss/env'
  const Env: EnvContract

  /**
   * Module exports
   */
  export interface EnvContract extends BaseContract {}
  export default Env
}
