/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Configuration module re-exports all functionality from @adonisjs/config.
 * This includes the Config class and related types for managing application
 * configuration files and environment-specific settings.
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
 */
export * from '@adonisjs/config'
