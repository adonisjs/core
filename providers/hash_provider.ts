/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '../src/types.js'
import { Argon, Bcrypt, Hash, Scrypt, driversList } from '../modules/hash/main.js'

/**
 * Registers the passwords hasher with the container
 */
export default class HashServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registering bundled drivers with the driversList collection
   */
  protected registerHashDrivers() {
    driversList.extend('bcrypt', (config) => new Bcrypt(config))
    driversList.extend('scrypt', (config) => new Scrypt(config))
    driversList.extend('argon2', (config) => new Argon(config))
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
    this.app.container.singleton('hash', async () => {
      const { HashManager } = await import('../modules/hash/main.js')
      const config = this.app.config.get<any>('hash')
      return new HashManager(config)
    })
  }

  /**
   * Registers bindings
   */
  register() {
    this.registerHashDrivers()
    this.registerHashManager()
    this.registerHash()
  }
}
