/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { InvalidArgumentsException } from '@poppinss/utils'
import driversCollection from './drivers_collection.js'
import type { EncryptionDriversList } from '../../src/types.js'
import type { ManagerDriverFactory } from '../../types/encryption.js'

export function defineConfig<
  KnownEncrypters extends Record<
    string,
    {
      [K in keyof EncryptionDriversList]: { driver: K } & Parameters<EncryptionDriversList[K]>[0]
    }[keyof EncryptionDriversList]
  >,
>(config: {
  default?: keyof KnownEncrypters
  list: KnownEncrypters
}): {
  default?: keyof KnownEncrypters
  driversInUse: Set<keyof EncryptionDriversList>
  list: { [K in keyof KnownEncrypters]: ManagerDriverFactory }
} {
  /**
   * Encrypters list should always be provided
   */
  if (!config.list) {
    throw new InvalidArgumentsException('Missing "list" property in encryption config')
  }

  /**
   * The default encrypter should be mentioned in the list
   */
  if (config.default && !config.list[config.default]) {
    throw new InvalidArgumentsException(
      `Missing "list.${String(
        config.default
      )}" in encryption config. It is referenced by the "default" property`
    )
  }

  /**
   * Converting list config to a collection that encryption manager can use
   */
  const driversInUse: Set<keyof EncryptionDriversList> = new Set()
  const managerEncrypters = Object.keys(config.list).reduce(
    (result, encrypter: keyof KnownEncrypters) => {
      const encrypterConfig = config.list[encrypter]
      driversInUse.add(encrypterConfig.driver)
      result[encrypter] = () => driversCollection.create(encrypterConfig.driver, encrypterConfig)
      return result
    },
    {} as { [K in keyof KnownEncrypters]: ManagerDriverFactory }
  )

  return {
    default: config.default,
    driversInUse,
    list: managerEncrypters,
  }
}
