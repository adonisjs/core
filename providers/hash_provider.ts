/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Hash, driversList } from '../modules/hash/main.js'
import type { ApplicationService, HashDriversList } from '../src/types.js'

/**
 * Registers the passwords hasher with the container
 */
export default class HashServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Lazily registers a hash driver with the driversList collection
   */
  protected async registerHashDrivers(driversInUse: Set<keyof HashDriversList>) {
    if (driversInUse.has('bcrypt')) {
      const { Bcrypt } = await import('../modules/hash/drivers/bcrypt.js')
      driversList.extend('bcrypt', (config) => new Bcrypt(config))
    }

    if (driversInUse.has('scrypt')) {
      const { Scrypt } = await import('../modules/hash/drivers/scrypt.js')
      driversList.extend('scrypt', (config) => new Scrypt(config))
    }

    if (driversInUse.has('argon2')) {
      const { Argon } = await import('../modules/hash/drivers/argon.js')
      driversList.extend('argon2', (config) => new Argon(config))
    }
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
      const config = this.app.config.get<any>('hash')
      const { HashManager } = await import('../modules/hash/main.js')
      return new HashManager(config)
    })
  }

  /**
   * Registers bindings
   */
  register() {
    this.registerHashManager()
    this.registerHash()
  }

  /**
   * Register drivers based upon hash config
   */
  boot() {
    this.app.container.resolving('hash', async () => {
      const config = this.app.config.get<any>('hash')
      await this.registerHashDrivers(config.driversInUse)
    })
  }
}
