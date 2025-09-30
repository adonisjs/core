/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Core helper utilities for AdonisJS applications. This module provides
 * a collection of commonly used utilities including file system operations,
 * cryptographic functions, composition utilities, and HTTP server helpers.
 *
 * @example
 * // File system utilities
 * import { fsReadAll, fsImportAll } from '@adonisjs/core/helpers'
 *
 * const files = await fsReadAll(url('app/controllers'))
 * const modules = await fsImportAll(url('app/events'))
 *
 * @example
 * // Cryptographic utilities
 * import { base64, safeEqual, Secret } from '@adonisjs/core/helpers'
 *
 * const encoded = base64.encode('sensitive data')
 * const isEqual = safeEqual(hash1, hash2)
 * const secret = new Secret('my-secret-key')
 *
 * @example
 * // HTTP server helpers
 * import { middlewareInfo, routeInfo } from '@adonisjs/core/helpers'
 *
 * const middleware = middlewareInfo('cors', () => {})
 * const route = routeInfo('users.show', '/users/:id')
 */

/**
 * File system utilities for reading and importing files recursively.
 */
export { fsReadAll, fsImportAll } from '@poppinss/utils/fs'

/**
 * Base64 encoding and decoding utilities.
 */
export { default as base64 } from '@poppinss/utils/base64'

/**
 * Core utilities including function composition, secret management,
 * safe equality comparison, and message building.
 */
export { compose, Secret, safeEqual, MessageBuilder, defineStaticProperty } from '@poppinss/utils'

/**
 * Verification token utility for creating secure tokens.
 */
export { VerificationToken } from './verification_token.ts'

/**
 * HTTP server helper functions for middleware and route information.
 */
export { middlewareInfo, routeInfo } from '@adonisjs/http-server/helpers'
