/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type ConsoleDumpConfig } from '@poppinss/dumper/console/types'
import { type HTMLDumpConfig } from '@poppinss/dumper/html/types'

/**
 * Define configuration for the dumper service exported by the
 * "@adonisjs/core/services/dumper" module. This function allows
 * you to customize HTML and console output formatting options.
 *
 * @param dumperConfig - Configuration object with HTML and console options
 * @param dumperConfig.html - HTML output formatting configuration
 * @param dumperConfig.console - Console output formatting configuration
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   html: {
 *     showHidden: true,
 *     depth: 5,
 *     colors: true
 *   },
 *   console: {
 *     showHidden: false,
 *     depth: 3,
 *     collapse: ['Date', 'DateTime']
 *   }
 * })
 * ```
 */
export function defineConfig(
  dumperConfig: Partial<{ html: HTMLDumpConfig; console: ConsoleDumpConfig }>
) {
  return dumperConfig
}
