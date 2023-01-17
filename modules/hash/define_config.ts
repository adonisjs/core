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
import type { HashDriversList } from '../../src/types.js'
import type { ManagerDriverFactory } from '../../types/hash.js'

/**
 * Define config for the hash service.
 */
export function defineConfig<
  KnownHashers extends Record<
    string,
    {
      [K in keyof HashDriversList]: { driver: K } & Parameters<HashDriversList[K]>[0]
    }[keyof HashDriversList]
  >
>(config: {
  default?: keyof KnownHashers
  list: KnownHashers
}): {
  default?: keyof KnownHashers
  list: { [K in keyof KnownHashers]: ManagerDriverFactory }
} {
  /**
   * Hashers list should always be provided
   */
  if (!config.list) {
    throw new InvalidArgumentsException('Missing "list" property in hash config')
  }

  /**
   * The default hasher should be mentioned in the list
   */
  if (config.default && !config.list[config.default]) {
    throw new InvalidArgumentsException(
      `Missing "list.${String(
        config.default
      )}" in hash config. It is referenced by the "default" property`
    )
  }

  /**
   * Converting list config to a collection that hash manager can use
   */
  const managerHashers = Object.keys(config.list).reduce((result, disk: keyof KnownHashers) => {
    const hasherConfig = config.list[disk]
    result[disk] = () => driversCollection.create(hasherConfig.driver, hasherConfig)
    return result
  }, {} as { [K in keyof KnownHashers]: ManagerDriverFactory })

  return {
    default: config.default,
    list: managerHashers,
  }
}
