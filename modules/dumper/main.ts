/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Dumper module provides debugging and inspection utilities for AdonisJS applications.
 * Includes the Dumper class for formatting output, error classes, and configuration helpers.
 *
 * @example
 * // Use the dumper service
 * import { Dumper } from '@adonisjs/core/dumper'
 *
 * const dumper = new Dumper(app)
 * const htmlOutput = dumper.dumpToHtml(user, { title: 'User Data' })
 * const ansiOutput = dumper.dumpToAnsi(user, { title: 'Debug User' })
 *
 * @example
 * // Configure dumper output
 * import { defineConfig } from '@adonisjs/core/dumper'
 *
 * export default defineConfig({
 *   html: { showHidden: true, depth: 5 },
 *   console: { collapse: ['Date', 'DateTime'] }
 * })
 */
export * as errors from './errors.ts'
export { Dumper } from './dumper.ts'
export { defineConfig } from './define_config.ts'
