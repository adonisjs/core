/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type LoggerConfig, type PrettyTargetOptions } from '@adonisjs/logger/types'

import { destination } from '@adonisjs/logger'
export * from '@adonisjs/logger'

/**
 * Creates a synchronous Pino Pretty stream for formatted log output.
 *
 * This function is specifically designed for testing and development environments
 * where synchronous log output is preferred. By default, Pino uses asynchronous
 * logging which can make it difficult to correlate logs with specific actions
 * during debugging or testing.
 *
 * @param options - Configuration options for the pretty printer
 *
 * @example
 * const loggerConfig = defineConfig({
 *   default: 'app',
 *   loggers: {
 *     app: {
 *       enabled: true,
 *       name: env.get('APP_NAME'),
 *       level: env.get('LOG_LEVEL'),
 *       desination: !app.inProduction && (await syncDestination()),
 *       transport: {
 *         targets: [targets.file({ destination: 1 })],
 *       },
 *     },
 *   }
 * })
 *
 * @returns A promise that resolves to a PrettyStream instance
 */
export async function syncDestination(
  options?: PrettyTargetOptions
): Promise<LoggerConfig['desination']> {
  const { default: pinoPretty, isColorSupported } = await import('pino-pretty')
  return isColorSupported ? pinoPretty({ ...options, sync: true }) : destination(1)
}
