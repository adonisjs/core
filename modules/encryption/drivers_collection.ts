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
 * globally available drivers applicable to the encryption manager
 * instance registered with the container.
 */

import { RuntimeException } from '@poppinss/utils'
import type { EncryptionDriversList } from '../../src/types.js'

/**
 * A global collection of Hash drivers
 */
class EncryptionDriversCollection {
  /**
   * List of registered drivers
   */
  list: Partial<EncryptionDriversList> = {}

  /**
   * Extend drivers collection and add a custom
   * driver to it.
   */
  extend<Name extends keyof EncryptionDriversList>(
    driverName: Name,
    factoryCallback: EncryptionDriversList[Name]
  ): this {
    this.list[driverName] = factoryCallback
    return this
  }

  /**
   * Creates the driver instance with config
   */
  create<Name extends keyof EncryptionDriversList>(
    name: Name,
    config: Parameters<EncryptionDriversList[Name]>[0]
  ) {
    const driverFactory = this.list[name]
    if (!driverFactory) {
      throw new RuntimeException(
        `Unknown encryption driver "${String(name)}". Make sure the driver is registered`
      )
    }

    return driverFactory(config as any)
  }
}

export default new EncryptionDriversCollection()
