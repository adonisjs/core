/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Helper types and utilities for AdonisJS applications.
 * Re-exports commonly used type utilities and file system operation types.
 *
 * @example
 * // Use Opaque type for branded primitives
 * import type { Opaque } from '@adonisjs/core/types/helpers'
 *
 * type UserId = Opaque<'UserId', number>
 * const userId: UserId = 123 as UserId
 *
 * @example
 * // Use file system option types
 * import type { ImportAllFilesOptions } from '@adonisjs/core/types/helpers'
 *
 * const options: ImportAllFilesOptions = {
 *   ignoreMissingExports: true,
 *   transformKeys: (key) => key.toLowerCase()
 * }
 */
export type { Opaque, NormalizeConstructor } from '@poppinss/utils/types'
export type { ImportAllFilesOptions, ReadAllFilesOptions } from '@poppinss/utils/fs'
