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
declare module '@ioc:Adonis/Core/Logger' {
  import { LoggerContract as BaseContract, LoggerConfigContract } from '@poppinss/logger'

  const Logger: LoggerContract

  /**
   * Module exports
   */
  export interface LoggerContract extends BaseContract {}
  export { LoggerConfigContract }
  export default Logger
}
