/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.ts'
import { emitRouteTypes, importAssembler } from '../src/utils.ts'

/**
 * Regenerate the contents of the ".adonisjs" directory without starting the
 * HTTP server.
 *
 * These files are otherwise generated as a side-effect of running the
 * dev-server, the test runner or creating a build. This command performs the
 * same work on its own, so the generated types can be refreshed
 * deterministically. For example, inside a CI pipeline before typechecking or
 * deploying the application.
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
   * Help text for the command
   */
  static help = [
    'Regenerate the codegen files without starting the HTTP server.',
    '```',
    '{{ binaryName }} codegen',
    '```',
    '',
    'Use it inside a CI pipeline to keep the generated types up-to-date before',
    'typechecking or building the application, without committing them to git.',
    '```',
    'npm ci && {{ binaryName }} codegen && npm run typecheck',
    '```',
  ]

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
        'If you are using the codegen command inside a CI or with a deployment platform, make sure it runs after installing the development dependencies.',
      ].join('\n')
    )
  }

  /**
   * Warm up the application and return the state the codegen needs from it.
   *
   * The app is assembled the way the web environment assembles it, since the
   * generated files describe the app that serves requests. However, it is
   * created in the "warmup" mode, so it never becomes ready and none of the
   * long running side-effects registered by the providers kick in.
   */
  async #warmUpApp() {
    this.app.setEnvironment('web')
    this.app.setMode('warmup')

    await this.app.boot()
    await this.app.warmUp()

    /**
     * Commit the router, so the routes can be turned into their types and
     * handed over to the assembler
     */
    const router = await this.app.container.make('router')
    router.commit()

    await emitRouteTypes(this.app, router)

    /**
     * The routes are round tripped through JSON, because that is how the
     * dev-server hands them over to the assembler. The round trip drops the
     * handler of the routes registered using a closure and strips the
     * properties that cannot be serialized, so the assembler is given the exact
     * same shape by both the paths
     */
    return { routes: JSON.parse(JSON.stringify(router.toJSON())) }
  }

  /**
   * Generate the codegen files
   */
  async run() {
    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    const codegen = new assembler.CodeGen(this.app.appRoot, {
      hooks: this.app.rcFile.hooks,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    codegen.ui.logger = this.logger

    /**
     * The app is booted from within the callback, because its preload files
     * import the index files the codegen writes before invoking it
     */
    await codegen.run(() => this.#warmUpApp())

    this.logger.success('Codegen files generated')
  }
}
