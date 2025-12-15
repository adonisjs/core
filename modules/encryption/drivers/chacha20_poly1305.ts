/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * ChaCha20-Poly1305 encryption driver implementation.
 *
 * This driver provides authenticated encryption and decryption using the
 * ChaCha20-Poly1305 algorithm. ChaCha20 is a modern stream cipher that
 * provides excellent performance on systems without AES hardware acceleration.
 * Combined with Poly1305 for authentication, it offers both confidentiality
 * and authenticity.
 *
 * @example
 * ```ts
 * const driver = new ChaCha20Poly1305({
 *   id: 'app',
 *   key: 'your-256-bit-key-here'
 * })
 *
 * const encrypted = driver.encrypt('sensitive data')
 * const decrypted = driver.decrypt(encrypted)
 * ```
 */
export { ChaCha20Poly1305 } from '@boringnode/encryption/drivers/chacha20_poly1305'
