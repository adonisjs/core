/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '../modules/ace/main.js'
import { detectAssetsBundler, importAssembler, importTypeScript } from '../src/internal_helpers.js'

/**
 * Serve command is used to run the AdonisJS HTTP server during development. The
 * command under the hood runs the "bin/server.ts" file and watches for file
 * system changes
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

  @flags.boolean({ description: 'Watch filesystem and restart the HTTP server on file change' })
  declare watch?: boolean

  @flags.boolean({ description: 'Ignore TypeScript errors and continue with the build process' })
  declare ignoreTsErrors?: boolean

  @flags.string({
    description: 'Select the package manager you want to use to install production dependencies',
  })
  declare packageManager?: 'npm' | 'pnpm' | 'yarn'

  @flags.boolean({
    description: 'Build frontend assets',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare assets?: boolean

  @flags.array({
    description: 'Define CLI arguments to pass to the assets bundler',
  })
  declare assetsArgs?: string[]

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

    const assetsBundler = await detectAssetsBundler(this.app)
    const bundler = new assembler.Bundler(this.app.appRoot, ts, {
      assets: assetsBundler
        ? {
            serve: this.assets === false ? false : true,
            driver: assetsBundler.name,
            cmd: assetsBundler.buildCommand,
            args: this.assetsArgs || [],
          }
        : {
            serve: false,
          },
      metaFiles: this.app.rcFile.metaFiles,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    bundler.setLogger(this.logger)

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
