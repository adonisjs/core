/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This class exists in the core, because it maintains a list of
 * globally available drivers applicable to the hash manager
 * instance registered with the container.
 *
 * In other words, these drivers are not needed by the hash module
 * regular usage and specific to AdonisJS container flow.
 */

import { RuntimeException } from '@poppinss/utils'
import type { HashDriversList } from '../../src/types.js'

/**
 * A global collection of Hash drivers
 */
class HashDriversCollection {
  /**
   * List of registered drivers
   */
  list: Partial<HashDriversList> = {}

  /**
   * Extend drivers collection and add a custom
   * driver to it.
   */
  extend<Name extends keyof HashDriversList>(
    driverName: Name,
    factoryCallback: HashDriversList[Name]
  ): this {
    this.list[driverName] = factoryCallback
    return this
  }

  /**
   * Creates the driver instance with config
   */
  create<Name extends keyof HashDriversList>(
    name: Name,
    config: Parameters<HashDriversList[Name]>[0]
  ) {
    const driverFactory = this.list[name]
    if (!driverFactory) {
      throw new RuntimeException(
        `Unknown hash driver "${String(name)}". Make sure the driver is registered`
      )
    }

    return driverFactory(config as any)
  }
}

export default new HashDriversCollection()
