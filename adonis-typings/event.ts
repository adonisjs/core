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
declare module '@ioc:Adonis/Core/Events' {
  import { EmitterContract as BaseContract } from '@poppinss/events'

  const Event: EmitterContract<EventsMap>

  /**
   * Module exports
   */
  export interface EmitterContract<T extends any> extends BaseContract<T> {}
  export interface EventsMap {}

  export default Event
}
