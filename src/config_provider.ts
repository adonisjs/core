/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationService, ConfigProvider } from './types.js'

/**
 * Helper to create config provider and resolve config from
 * them
 */
export const configProvider = {
  create<T>(resolver: ConfigProvider<T>['resolver']): ConfigProvider<T> {
    return {
      type: 'provider',
      resolver,
    }
  },

  async resolve<T>(app: ApplicationService, provider: unknown): Promise<T | null> {
    if (provider && typeof provider === 'object' && 'type' in provider) {
      return (provider as ConfigProvider<T>).resolver(app)
    }

    return null
  },
}
