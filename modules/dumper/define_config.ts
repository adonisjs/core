/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ConsoleDumpConfig } from '@poppinss/dumper/console/types'
import { HTMLDumpConfig } from '@poppinss/dumper/html/types'

/**
 * Define config for the dumper service exported by
 * the "@adonisjs/core/services/dumper" module
 */
export function defineConfig(
  dumperConfig: Partial<{ html: HTMLDumpConfig; console: ConsoleDumpConfig }>
) {
  return dumperConfig
}
