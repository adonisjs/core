/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * AES-256-GCM encryption driver implementation.
 *
 * This driver provides authenticated encryption and decryption using the
 * AES-256-GCM (Advanced Encryption Standard with 256-bit key in Galois/Counter Mode)
 * algorithm. GCM mode provides both confidentiality and authenticity, making it
 * the recommended choice for modern applications. It offers excellent performance
 * on systems with AES hardware acceleration.
 *
 * @example
 * ```ts
 * const driver = new AES256GCM({
 *   id: 'app',
 *   key: 'your-256-bit-key-here'
 * })
 *
 * const encrypted = driver.encrypt('sensitive data')
 * const decrypted = driver.decrypt(encrypted)
 * ```
 */
export { AES256GCM } from '@boringnode/encryption/drivers/aes_256_gcm'
