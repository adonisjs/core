/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Hash, HashManager } from '../modules/hash/main.js'
import type { AbstractConstructor } from '../types/container.js'
import type { ApplicationService, HashService } from '../src/types.js'
import hashDriversCollection from '../modules/hash/drivers_collection.js'

/**
 * Registers the passwords hasher with the container
 */
export default class HashServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the hash drivers collection to the container. The
   * collection can be extended to add custom drivers.
   */
  protected registerHashDrivers() {
    this.app.container.singleton('hashDrivers', () => hashDriversCollection)
  }

  /**
   * Registering the hash class to resolve an instance with the
   * default hasher.
   */
  protected registerHash() {
    this.app.container.singleton(Hash, async (resolver) => {
      const hashManager = await resolver.make('hash')
      return hashManager.use()
    })
  }

  /**
   * Registers the hash manager with the container
   */
  protected registerHashManager() {
    this.app.container.singleton<AbstractConstructor<HashService>>(HashManager, async () => {
      const config = this.app.config.get<any>('hash')
      return new HashManager(config)
    })
    this.app.container.alias('hash', HashManager)
  }

  /**
   * Registers bindings
   */
  register() {
    this.registerHashManager()
    this.registerHashDrivers()
    this.registerHash()
  }
}
