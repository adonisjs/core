/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Main encryption class for encrypting and decrypting values.
 *
 * Provides methods to encrypt strings and objects with optional purpose
 * binding, decrypt values, and manage encryption keys.
 *
 * @example
 * ```ts
 * const encryption = new Encryption({ key: 'secret-key' })
 * const encrypted = encryption.encrypt('sensitive data')
 * const decrypted = encryption.decrypt(encrypted)
 * ```
 */
export { Encryption } from '@boringnode/encryption'

/**
 * Manager class for handling multiple encryption instances.
 *
 * Allows you to configure and manage multiple encryption drivers,
 * switch between them, and use different encryption keys for
 * different purposes.
 *
 * @example
 * ```ts
 * const manager = new EncryptionManager({
 *   default: 'app',
 *   list: {
 *     app: {
 *       driver: (key) => new AES256GCM({ key }),
 *       keys: ['app-key']
 *     }
 *   }
 * })
 * const encryptor = manager.use('app')
 * ```
 */
export { EncryptionManager } from '@boringnode/encryption'

/**
 * HMAC (Hash-based Message Authentication Code) class for creating
 * and verifying message authentication codes.
 *
 * Provides methods to generate cryptographic hashes with a secret key
 * and verify them to ensure data integrity and authenticity.
 *
 * @example
 * ```ts
 * const hmac = new Hmac('secret-key')
 * const signature = hmac.generate('message')
 * const isValid = hmac.verify('message', signature)
 * ```
 */
export { Hmac } from '@boringnode/encryption'

/**
 * Base class for implementing custom encryption drivers.
 *
 * Extend this class to create custom encryption implementations
 * that can be used with the EncryptionManager.
 *
 * @example
 * ```ts
 * class CustomDriver extends BaseDriver {
 *   encrypt(value: string) {
 *     // Custom encryption logic
 *   }
 *   decrypt(payload: string) {
 *     // Custom decryption logic
 *   }
 * }
 * ```
 */
export { BaseDriver } from '@boringnode/encryption'

/**
 * Defines the encryption configuration for the application.
 *
 * @see {defineConfig} in define_config.ts for detailed documentation
 */
export { defineConfig } from './define_config.ts'

/**
 * Collection of built-in encryption driver factory functions.
 *
 * Includes factories for ChaCha20-Poly1305, AES-256-CBC, and
 * AES-256-GCM encryption algorithms.
 *
 * @see {drivers} in define_config.ts for detailed documentation
 */
export { drivers } from './define_config.ts'
