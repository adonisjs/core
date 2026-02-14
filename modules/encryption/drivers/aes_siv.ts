/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * AES-SIV encryption driver implementation.
 *
 * This driver provides deterministic authenticated encryption using AES-SIV
 * (Synthetic Initialization Vector). It is useful when you need equality
 * queries over encrypted values while preserving authenticity guarantees.
 *
 * @example
 * ```ts
 * const driver = new AESSIV({
 *   id: 'app',
 *   key: 'your-256-bit-key-here'
 * })
 *
 * const encrypted = driver.encrypt('sensitive data')
 * const decrypted = driver.decrypt(encrypted)
 * ```
 */
export { AESSIV } from '@boringnode/encryption/drivers/aes_siv'
