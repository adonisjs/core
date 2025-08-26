/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '../modules/ace/main.ts'
import { importAssembler, importTypeScript } from '../src/internal_helpers.ts'

/**
 * Create the production build by compiling TypeScript source and the
 * frontend assets
 */
export default class Build extends BaseCommand {
  static commandName = 'build'
  static description =
    'Build application for production by compiling frontend assets and TypeScript source to JavaScript'

  static help = [
    'Create the production build using the following command.',
    '```',
    '{{ binaryName }} build',
    '```',
    '',
    'The assets bundler dev server runs automatically after detecting vite config or webpack config files',
    'You may pass vite CLI args using the --assets-args command line flag.',
    '```',
    '{{ binaryName }} build --assets-args="--debug --base=/public"',
    '```',
  ]

  @flags.boolean({ description: 'Ignore TypeScript errors and continue with the build process' })
  declare ignoreTsErrors?: boolean

  @flags.string({
    description: 'Define the package manager to copy the appropriate lock file',
  })
  declare packageManager?: 'npm' | 'pnpm' | 'yarn' | 'yarn@berry' | 'bun'

  /**
   * Log a development dependency is missing
   */
  #logMissingDevelopmentDependency(dependency: string) {
    this.logger.error(
      [
        `Cannot find package "${dependency}"`,
        '',
        `The "${dependency}" package is a development dependency and therefore you should use the build command with development dependencies installed.`,
        '',
        'If you are using the build command inside a CI or with a deployment platform, make sure the NODE_ENV is set to "development"',
      ].join('\n')
    )
  }

  /**
   * Build application
   */
  async run() {
    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    const ts = await importTypeScript(this.app)
    if (!ts) {
      this.#logMissingDevelopmentDependency('typescript')
      this.exitCode = 1
      return
    }

    const bundler = new assembler.Bundler(this.app.appRoot, ts, {
      metaFiles: this.app.rcFile.metaFiles,
      hooks: this.app.rcFile.hooks,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    bundler.ui.logger = this.logger

    /**
     * Bundle project for production
     */
    const stopOnError = this.ignoreTsErrors === true ? false : true
    const builtSuccessfully = await bundler.bundle(stopOnError, this.packageManager)
    if (!builtSuccessfully) {
      this.exitCode = 1
    }
  }
}
