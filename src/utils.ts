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
 * Imports the AdonisJS assembler package optionally. This function attempts
 * to import the assembler and returns undefined if it's not available,
 * making it safe to use in environments where the assembler might not be installed.
 *
 * @param app - The application service instance used for importing the assembler
 *
 * @example
 * const assembler = await importAssembler(app)
 * if (assembler) {
 *   // Use assembler functionality
 *   const generator = new assembler.IndexGenerator()
 * }
 */
export async function importAssembler(
  app: ApplicationService
): Promise<typeof Assembler | undefined> {
  try {
    return await app.import('@adonisjs/assembler')
  } catch {}
}

/**
 * Imports the TypeScript compiler package optionally. This function attempts
 * to import TypeScript and returns undefined if it's not available,
 * making it safe to use in environments where TypeScript might not be installed.
 *
 * @param app - The application service instance used for importing TypeScript
 *
 * @example
 * const ts = await importTypeScript(app)
 * if (ts) {
 *   // Use TypeScript compiler API
 *   const program = ts.createProgram(['file.ts'], {})
 *   const sourceFile = program.getSourceFile('file.ts')
 * }
 */
export async function importTypeScript(
  app: ApplicationService
): Promise<typeof typescript | undefined> {
  try {
    return await app.importDefault('typescript')
  } catch {}
}
