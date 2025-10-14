/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Hash module provides password hashing functionality with multiple driver support.
 * Re-exports all functionality from @adonisjs/hash along with configuration utilities.
 *
 * @example
 * // Import the Hash manager and drivers
 * import { HashManager, Hash } from '@adonisjs/core/hash'
 *
 * const manager = new HashManager(config)
 * const hasher = manager.use('scrypt')
 * const hashed = await hasher.make('password')
 * const verified = await hasher.verify(hashed, 'password')
 *
 * @example
 * // Import configuration and driver types
 * import { defineConfig, drivers } from '@adonisjs/core/hash'
 * import type { HashConfig, ScryptConfig } from '@adonisjs/core/types/hash'
 */
export * from '@adonisjs/hash'
export { defineConfig, drivers } from './define_config.ts'
