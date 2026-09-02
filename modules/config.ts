/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Configuration module re-exports @adonisjs/config and the config provider
 * helper used to defer configuration resolution until application boot.
 *
 * @example
 * // Import the Config class
 * import { Config } from '@adonisjs/core/config'
 *
 * const config = new Config()
 * config.set('database.connection', 'mysql')
 * const dbConnection = config.get('database.connection')
 *
 * @example
 * // Import configuration types
 * import type { ConfigProvider } from '@adonisjs/core/config'
 *
 * // Create a lazy configuration provider
 * import { configProvider } from '@adonisjs/core/config'
 */
export * from '@adonisjs/config'
export { configProvider } from '../src/config_provider.ts'
