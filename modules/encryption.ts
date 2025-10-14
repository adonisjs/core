/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Encryption module re-exports all functionality from @adonisjs/encryption.
 * This includes the Encryption class and related utilities for encrypting and
 * decrypting data using various algorithms and key management strategies.
 *
 * @example
 * // Import the Encryption class
 * import { Encryption } from '@adonisjs/core/encryption'
 *
 * const encryption = new Encryption({ secret: 'your-secret-key' })
 * const encrypted = encryption.encrypt('sensitive data')
 * const decrypted = encryption.decrypt(encrypted)
 *
 * @example
 * // Import encryption types and utilities
 * import type { EncryptionConfig, DriverContract } from '@adonisjs/core/encryption'
 */
export * from '@adonisjs/encryption'
