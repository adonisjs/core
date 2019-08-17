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
declare module '@ioc:Adonis/Core/Profiler' {
  import { ProfilerContract as BaseContract, ProfilerConfig } from '@poppinss/profiler'

  const Profiler: ProfilerContract

  /**
   * Module exports
   */
  export interface ProfilerContract extends BaseContract {}
  export { ProfilerConfig as ProfilerConfigContract }
  export default Profiler
}
