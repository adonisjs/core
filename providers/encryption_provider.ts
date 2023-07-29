/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Encryption, driversList } from '../modules/encryption/main.js'
import type { ApplicationService, EncryptionDriversList } from '../src/types.js'

/**
 * Registers the encryption module with the container
 */
export default class EncryptionServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Lazily registers encryption driver with the driversList collection
   */
  protected async registerEncryptionDrivers(driversInUse: Set<keyof EncryptionDriversList>) {
    if (driversInUse.has('legacy')) {
      const { Legacy } = await import('../modules/encryption/drivers/legacy.js')
      driversList.extend('legacy', (config) => new Legacy(config))
    }
  }

  /**
   * Registering the encryption class to resolve an instance with the
   * default encrypters.
   */
  protected registerEncryption() {
    this.app.container.singleton(Encryption, async (resolver) => {
      const encryptionManager = await resolver.make('encryption')
      return encryptionManager.use()
    })
  }

  /**
   * Registers the encryption manager with the container
   */
  protected registerEncryptionManager() {
    this.app.container.singleton('encryption', async () => {
      const config = this.app.config.get<any>('encryption')
      const { EncryptionManager } = await import('../modules/encryption/main.js')
      return new EncryptionManager(config)
    })
  }

  /**
   * Registers bindings
   */
  register() {
    this.registerEncryptionManager()
    this.registerEncryption()
  }

  /**
   * Register drivers based upon encryption config
   */
  boot() {
    this.app.container.resolving('encryption', async () => {
      const config = this.app.config.get<any>('encryption')
      await this.registerEncryptionDrivers(config.driversInUse)
    })
  }
}
