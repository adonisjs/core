/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type typescript from 'typescript'
import type * as Assembler from '@adonisjs/assembler'
import { type ApplicationService } from './types.ts'

/**
 * Imports assembler optionally
 */
export async function importAssembler(
  app: ApplicationService
): Promise<typeof Assembler | undefined> {
  try {
    return await app.import('@adonisjs/assembler')
  } catch {}
}

/**
 * Imports typescript optionally
 */
export async function importTypeScript(
  app: ApplicationService
): Promise<typeof typescript | undefined> {
  try {
    return await app.importDefault('typescript')
  } catch {}
}
