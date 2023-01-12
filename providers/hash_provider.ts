/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Hash, HashManager } from '../modules/hash.js'
import type { ApplicationService } from '../src/types.js'
import type { HashManagerConfig } from '../types/hash.js'

/**
 * Registers the passwords hasher with the container
 */
export default class HashServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the passwords hasher with the container
   */
  protected registerHash() {
    this.app.container.singleton(HashManager, async () => {
      const config = this.app.config.get<HashManagerConfig<any>>('hash', {})
      return new HashManager(config)
    })
    this.app.container.alias('hash', HashManager)

    this.app.container.singleton(Hash, async (resolver) => {
      const hashManager = await resolver.make('hash')
      return hashManager.use()
    })
  }

  register() {
    this.registerHash()
  }
}
