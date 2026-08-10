/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { fileURLToPath } from 'node:url'

import Hooks from '@poppinss/hooks'
import { importDefault } from '@poppinss/utils'
import type { AllHooks, HookParams } from '@adonisjs/assembler/types'
import type { IndexGenerator as IndexGeneratorType } from '@adonisjs/assembler/index_generator'

import stringHelpers from '../helpers/string.ts'
import type { UIPrimitives } from '../../types/ace.ts'
import type { ApplicationService } from '../types.ts'

/**
 * Registers the "init" hooks defined inside the application rc file
 * with the given index generator and generates the index files.
 *
 * The method is a standalone alternative to the codegen performed by
 * the dev-server, the bundler and the test runner. It creates an index
 * generator, runs all the "init" hooks (for example `indexEntities`,
 * `indexPages` and `generateRegistry`) and writes the generated files
 * to the `.adonisjs` directory.
 *
 * @param app - The application instance
 * @param ui - The CLI UI primitives used to log progress messages
 *
 * @example
 * const indexGenerator = await generateIndexFiles(app, ui)
 * if (indexGenerator) {
 *   // Index files have been generated
 * }
 */
export async function generateIndexFiles(app: ApplicationService, ui: UIPrimitives) {
  /**
   * Import the index generator from the assembler package. The package
   * is a development dependency and therefore may not be installed
   */
  let IndexGenerator: typeof IndexGeneratorType
  try {
    const indexGeneratorModule = await app.import('@adonisjs/assembler/index_generator')
    IndexGenerator = indexGeneratorModule.IndexGenerator
  } catch {
    return undefined
  }

  const appRoot = stringHelpers.toUnixSlash(fileURLToPath(app.appRoot))
  const indexGenerator = new IndexGenerator(appRoot, ui.logger)
  const hooks = new Hooks<{
    [P in keyof AllHooks]: [HookParams<P>, HookParams<P>]
  }>()

  /**
   * Resolve the "init" hooks and run them against the index generator.
   * The hooks are either an object with a "run" method or a lazy import
   * resolving to the default export
   */
  const initHooks = app.rcFile.hooks?.init ?? []
  for (const hook of initHooks) {
    const run = 'run' in hook ? hook.run : await importDefault(hook)

    /**
     * The parent argument is not available in the standalone codegen
     * command, so it is passed as "undefined"
     */
    await run(undefined as never, hooks, indexGenerator)
  }

  /**
   * Generate the index files
   */
  await indexGenerator.generate()

  return indexGenerator
}
