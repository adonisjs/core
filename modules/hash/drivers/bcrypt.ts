/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Bcrypt hash driver re-exports from @adonisjs/hash.
 * Provides bcrypt password hashing functionality with configurable rounds.
 *
 * @example
 * import { Bcrypt } from '@adonisjs/core/hash/drivers/bcrypt'
 *
 * const bcrypt = new Bcrypt({ rounds: 12 })
 * const hashed = await bcrypt.make('password')
 * const isValid = await bcrypt.verify(hashed, 'password')
 */
export * from '@adonisjs/hash/drivers/bcrypt'
