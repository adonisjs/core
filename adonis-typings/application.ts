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
declare module '@ioc:Adonis/Core/Application' {
  import { ApplicationContract as BaseContract } from '@poppinss/application'
  const Application: ApplicationContract

  /**
   * Module exports
   */
  export interface ApplicationContract extends BaseContract {}
  export default Application
}
