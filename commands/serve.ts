/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { DevServer } from '@adonisjs/assembler'
import { importAssembler } from '../src/utils.ts'
import type { CommandOptions } from '../types/ace.ts'
import { BaseCommand, flags } from '../modules/ace/main.ts'

/**
 * Serve command is used to run the AdonisJS HTTP server during development. The
 * command under the hood runs the "bin/server.ts" file and watches for file
 * system changes
 *
 * @example
 * ```
 * ace serve
 * ace serve --watch
 * ace serve --hmr
 * ace serve --poll
 * ace serve --no-clear
 * ```
 */
export default class Serve extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'serve'
  /**
   * The command description
   */
  static description =
    'Start the development HTTP server. Use --watch for auto-restart on file change or --hmr for hot module replacement'

  /**
   * Help text for the command
   */
  static help = [
    'Start the development server with file watcher using the following command.',
    '```',
    '{{ binaryName }} serve --watch',
    '```',
    '',
    'You can also start the server with HMR support using the following command.',
    '```',
    '{{ binaryName }} serve --hmr',
    '```',
    '',
    'The assets bundler dev server runs automatically after detecting vite config or webpack config files',
    'You may pass vite CLI args using the --assets-args command line flag.',
    '```',
    '{{ binaryName }} serve --assets-args="--debug --base=/public"',
    '```',
  ]

  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    staysAlive: true,
  }

  /**
   * The development server instance
   */
  declare devServer: DevServer

  /**
   * Start the server with HMR support
   */
  @flags.boolean({ description: 'Start the server with HMR support' })
  declare hmr?: boolean

  /**
   * Watch filesystem and restart the HTTP server on file change
   */
  @flags.boolean({
    description: 'Watch filesystem and restart the HTTP server on file change',
    alias: 'w',
  })
  declare watch?: boolean

  /**
   * Use polling to detect filesystem changes
   */
  @flags.boolean({ description: 'Use polling to detect filesystem changes', alias: 'p' })
  declare poll?: boolean

  /**
   * Clear the terminal for new logs after file change
   */
  @flags.boolean({
    description: 'Clear the terminal for new logs after file change',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare clear?: boolean

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
        `The "${dependency}" package is a development dependency and therefore you should use the serve command during development only.`,
        '',
        'If you are running your application in production, then use "node bin/server.js" command to start the HTTP server',
      ].join('\n')
    )
  }

  /**
   * Runs the HTTP server
   */
  async run() {
    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    if (this.watch && this.hmr) {
      this.logger.error('Cannot use --watch and --hmr flags together. Choose one of them')
      this.exitCode = 1
      return
    }

    const assemblerOptions = {
      hmr: this.hmr === true ? true : false,
      clearScreen: this.clear === false ? false : true,
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: [],
      metaFiles: this.app.rcFile.metaFiles,
      hooks: this.app.rcFile.hooks,
      directories: this.app.rcFile.directories,
    }
    this.devServer = new assembler.DevServer(this.app.appRoot, assemblerOptions)

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    this.devServer.ui.logger = this.logger

    /**
     * Exit command when the dev server is closed
     */
    this.devServer.onClose((exitCode) => {
      this.exitCode = exitCode
      this.terminate()
    })

    /**
     * Exit command when the dev server crashes
     */
    this.devServer.onError(() => {
      this.exitCode = 1
      this.terminate()
    })

    /**
     * Start the development server
     */
    if (this.watch) {
      await this.devServer.startAndWatch({ poll: this.poll || false })
    } else {
      await this.devServer.start()
    }
  }
}
