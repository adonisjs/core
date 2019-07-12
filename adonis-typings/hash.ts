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
declare module '@ioc:Adonis/Core/Hash' {
  import {
    HashDriverContract,
    HashDrivers as DriversList,
    HashContract as BaseContract,
    BcryptConfigContract,
    ArgonConfigContract,
  } from '@poppinss/hash'

  import { ExtractDriversConfig, DriverNodesList } from '@poppinss/manager'

  /**
   * Default list of hash drivers. The end user will have to extend this
   * interface, when they decide to extend the `hash` module with
   * a custom driver
   */
  export interface HashDrivers extends DriverNodesList<HashDriverContract, any> {
    bcrypt: {
      config: BcryptConfigContract,
      implementation: DriversList['bcrypt']['implementation'],
    },
    argon: {
      config: ArgonConfigContract,
      implementation: DriversList['argon']['implementation'],
    },
  }

  /**
   * The shape of config. This is determined by the list of
   * drivers supported by the hash module.
   */
  export type HashConfigContract = {
    driver: keyof HashDrivers,
  } & ExtractDriversConfig<HashDrivers>

  /**
   * Driver contract, that every driver must implement
   */
  export { HashDriverContract }

  /**
   * Static shape of hash module
   */
  interface HashContract extends BaseContract<HashDrivers> {}

  const Hash: HashContract
  export default Hash
}
