/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.ts'
import type { CommandOptions } from '../types/ace.ts'
import { emitRoutes } from '../src/codegen/emit_routes.ts'
import { generateIndexFiles } from '../src/codegen/indexes.ts'

/**
 * Generate the application codegen files (TypeScript type definitions
 * and index files) without booting the HTTP server.
 *
 * The command generates the same files that are created automatically
 * when booting the application in development mode:
 *
 * - `.adonisjs/server/routes.d.ts` and `.adonisjs/server/routes.json`
 * - `.adonisjs/server/controllers.ts`, `.adonisjs/server/events.ts` and
 *   `.adonisjs/server/listeners.ts`
 * - Any other file registered by the "init" hooks of the application
 *
 * @example
 * ```
 * ace codegen
 * ```
 */
export default class Codegen extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'codegen'
  /**
   * The command description
   */
  static description = 'Generate TypeScript type definitions and index files for the application'

  /**
   * Command options configuration. Requires the application to be
   * booted so that all the preloads are loaded and the routes are
   * registered.
   */
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Log a development dependency is missing
   *
   * @param dependency - The name of the missing dependency
   */
  #logMissingDevelopmentDependency(dependency: string) {
    this.logger.error(
      [
        `Cannot find package "${dependency}"`,
        '',
        `The "${dependency}" package is a development dependency and therefore you should use the codegen command with development dependencies installed.`,
        '',
        'If you are using the codegen command inside a CI or with a deployment platform, make sure the NODE_ENV is set to "development"',
      ].join('\n')
    )
  }

  /**
   * Generate the application codegen files
   */
  async run() {
    /**
     * Generate route types and JSON representation
     */
    const router = await this.app.container.make('router')
    router.commit()
    await emitRoutes(this.app, router)

    /**
     * Generate the index files using the "init" hooks registered
     * inside the application rc file
     */
    const indexGenerator = await generateIndexFiles(this.app, this.ui)
    if (!indexGenerator) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    this.logger.success('Codegen files generated')
  }
}
