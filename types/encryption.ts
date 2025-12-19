/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type EncryptionDriverContract } from '@boringnode/encryption/types'

/**
 * Contract that all encryption drivers must implement.
 *
 * Defines the interface for encrypting and decrypting values, including
 * support for optional purpose binding and child key derivation.
 */
export type { EncryptionDriverContract } from '@boringnode/encryption/types'

/**
 * Factory function signature for creating encryption driver instances.
 *
 * The factory receives an encryption key and returns a configured
 * driver instance. This pattern allows the manager to create drivers
 * on-demand with different keys.
 */
export type { ManagerDriverFactory } from '@boringnode/encryption/types'

/**
 * Configuration options for the AES-256-CBC encryption driver.
 *
 * Includes the driver identifier and a list of encryption keys.
 * The first key is used for encryption, while all keys are tried
 * for decryption (allowing for key rotation).
 */
export type { AES256CBCDriverConfig } from '@boringnode/encryption/drivers/aes_256_cbc'

/**
 * Configuration options for the AES-256-GCM encryption driver.
 *
 * Includes the driver identifier and a list of encryption keys.
 * The first key is used for encryption, while all keys are tried
 * for decryption (allowing for key rotation).
 */
export type { AES256GCMDriverConfig } from '@boringnode/encryption/drivers/aes_256_gcm'

/**
 * Configuration options for the ChaCha20-Poly1305 encryption driver.
 *
 * Includes the driver identifier and a list of encryption keys.
 * The first key is used for encryption, while all keys are tried
 * for decryption (allowing for key rotation).
 */
export type { ChaCha20Poly1305DriverConfig } from '@boringnode/encryption/drivers/chacha20_poly1305'

/**
 * Configuration object for encryption drivers. Defines how encryption
 * and decryption should be performed with support for key rotation.
 *
 * @example
 * const config: EncryptionConfig = {
 *   driver: (key) => new SecureEncryptor(key),
 *   keys: [
 *     'new-encryption-key',  // Used for encryption
 *     'old-encryption-key'   // Used only for decryption
 *   ]
 * }
 */
export interface EncryptionConfig {
  /**
   * Factory function that creates a driver instance for a given key
   * @param key - The encryption key to use
   */
  driver: (key: string) => EncryptionDriverContract

  /**
   * List of keys to use for encryption/decryption.
   * The first key is used for encryption, all keys are tried for decryption.
   */
  keys: string[]
}
