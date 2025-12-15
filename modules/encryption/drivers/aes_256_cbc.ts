/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * AES-256-CBC encryption driver implementation.
 *
 * This driver provides encryption and decryption using the AES-256-CBC
 * (Advanced Encryption Standard with 256-bit key in Cipher Block Chaining mode)
 * algorithm. While widely supported, AES-256-CBC does not provide authenticated
 * encryption. Consider using AES-256-GCM for new applications.
 *
 * @example
 * ```ts
 * const driver = new AES256CBC({
 *   id: 'app',
 *   key: 'your-256-bit-key-here'
 * })
 *
 * const encrypted = driver.encrypt('sensitive data')
 * const decrypted = driver.decrypt(encrypted)
 * ```
 */
export { AES256CBC } from '@boringnode/encryption/drivers/aes_256_cbc'
