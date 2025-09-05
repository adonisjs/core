/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@poppinss/utils/exception'

import { Hash } from '../modules/hash/main.ts'
import { configProvider } from '../src/config_provider.ts'
import type { ApplicationService } from '../src/types.ts'

/**
 * Registers the passwords hasher with the container
 *
 * This provider sets up password hashing functionality by:
 * - Registering the HashManager with configuration from config/hash.ts
 * - Providing a Hash class that uses the default hasher
 * - Supporting multiple hashing drivers (bcrypt, argon2, etc.)
 *
 * @example
 * const provider = new HashServiceProvider(app)
 * provider.register()
 * const hash = await app.container.make('hash')
 */
export default class HashServiceProvider {
  /**
   * Hash service provider constructor
   *
   * @param app - The application service instance
   */
  constructor(protected app: ApplicationService) {}

  /**
   * Registering the hash class to resolve an instance with the
   * default hasher.
   *
   * Creates a singleton binding for the Hash class that resolves
   * the default hasher from the hash manager.
   *
   * @example
   * const hash = await container.make(Hash)
   * const hashed = await hash.make('password')
   */
  protected registerHash() {
    this.app.container.singleton(Hash, async (resolver) => {
      const hashManager = await resolver.make('hash')
      return hashManager.use()
    })
  }

  /**
   * Registers the hash manager with the container
   *
   * Creates a singleton binding for 'hash' that instantiates
   * the HashManager with configuration from config/hash.ts file.
   * Throws an error if the configuration is invalid.
   *
   * @example
   * const hashManager = await container.make('hash')
   * const bcryptHasher = hashManager.use('bcrypt')
   */
  protected registerHashManager() {
    this.app.container.singleton('hash', async () => {
      const hashConfigProvider = this.app.config.get('hash')

      /**
       * Resolve config from the provider
       */
      const config = await configProvider.resolve<any>(this.app, hashConfigProvider)
      if (!config) {
        throw new RuntimeException(
          'Invalid "config/hash.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      const { HashManager } = await import('../modules/hash/main.js')
      return new HashManager(config)
    })
  }

  /**
   * Registers bindings
   *
   * Called during the application bootstrap phase to register
   * the hash manager and hash class with the IoC container.
   *
   * @example
   * const provider = new HashServiceProvider(app)
   * provider.register() // Registers hash services
   */
  register() {
    this.registerHashManager()
    this.registerHash()
  }
}
