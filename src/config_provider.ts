/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type ApplicationService, type ConfigProvider } from './types.ts'

/**
 * Helper utilities to create and resolve config providers. Config providers
 * are used to defer configuration resolution until the application is booted,
 * allowing access to environment variables and other application services.
 *
 * @example
 * // Creating a database config provider
 * const databaseConfig = configProvider.create(async (app) => ({
 *   connection: app.env.get('DB_CONNECTION', 'sqlite'),
 *   host: app.env.get('DB_HOST', 'localhost'),
 *   port: app.env.get('DB_PORT', 5432)
 * }))
 *
 * @example
 * // Resolving a config provider
 * const config = await configProvider.resolve(app, databaseConfig)
 * if (config) {
 *   console.log(`Database connection: ${config.connection}`)
 * }
 */
export const configProvider = {
  /**
   * Creates a new config provider that will resolve configuration
   * when the application is booted.
   *
   * @param resolver - Function that receives the application service and returns the configuration
   *
   * @example
   * const mailConfig = configProvider.create(async (app) => ({
   *   driver: app.env.get('MAIL_DRIVER', 'smtp'),
   *   host: app.env.get('SMTP_HOST'),
   *   port: app.env.get('SMTP_PORT', 587)
   * }))
   */
  create<T>(resolver: ConfigProvider<T>['resolver']): ConfigProvider<T> {
    return {
      type: 'provider',
      resolver,
    }
  },

  /**
   * Resolves a config provider if the provided value is a valid config provider,
   * otherwise returns null.
   *
   * @param app - The application service instance
   * @param provider - The potential config provider to resolve
   *
   * @example
   * const resolved = await configProvider.resolve(app, someProvider)
   * if (resolved) {
   *   // Use the resolved configuration
   *   console.log('Config resolved:', resolved)
   * } else {
   *   console.log('Not a valid config provider')
   * }
   */
  async resolve<T>(app: ApplicationService, provider: unknown): Promise<T | null> {
    if (provider && typeof provider === 'object' && 'type' in provider) {
      return (provider as ConfigProvider<T>).resolver(app)
    }

    return null
  },
}
