/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Contract that all encryption drivers must implement.
 *
 * Defines the interface for encrypting and decrypting values, including
 * support for optional purpose binding and child key derivation.
 */
export type { EncryptionDriverContract, EncryptionConfig } from '@boringnode/encryption/types'

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
 * Configuration options for the Legacy encryption driver.
 *
 * The Legacy driver maintains compatibility with the old AdonisJS v6
 * encryption format. It does not require a driver identifier since
 * the legacy format doesn't include one.
 */
export type { LegacyDriverConfig } from '../modules/encryption/drivers/legacy.ts'
