/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Environment module re-exports all functionality from @adonisjs/env.
 * This includes the Env class, validation schemas, and utilities for managing
 * environment variables with type safety and validation.
 *
 * @example
 * // Import the Env class and validation
 * import { Env } from '@adonisjs/core/env'
 *
 * const env = await Env.create(new URL('../', import.meta.url), {
 *   NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
 *   PORT: Env.schema.number(),
 *   HOST: Env.schema.string({ format: 'host' })
 * })
 *
 * @example
 * // Import environment types and utilities
 * import type { EnvParser, EnvEditor } from '@adonisjs/core/env'
 */
export * from '@adonisjs/env'
