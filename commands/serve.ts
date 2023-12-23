/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { DevServer } from '@adonisjs/assembler'
import type { CommandOptions } from '../types/ace.js'
import { BaseCommand, flags } from '../modules/ace/main.js'
import { detectAssetsBundler, importAssembler, importTypeScript } from '../src/internal_helpers.js'

/**
 * Serve command is used to run the AdonisJS HTTP server during development. The
 * command under the hood runs the "bin/server.ts" file and watches for file
 * system changes
 */
export default class Serve extends BaseCommand {
  static commandName = 'serve'
  static description =
    'Start the development HTTP server along with the file watcher to perform restarts on file change'

  static help = [
    'Start the development server with file watcher using the following command.',
    '```',
    '{{ binaryName }} serve --watch',
    '```',
    '',
    'The assets bundler dev server runs automatically after detecting vite config or webpack config files',
    'You may pass vite CLI args using the --assets-args command line flag.',
    '```',
    '{{ binaryName }} serve --assets-args="--debug --base=/public"',
    '```',
  ]

  static options: CommandOptions = {
    staysAlive: true,
  }

  declare devServer: DevServer

  @flags.boolean({
    description: 'Watch filesystem and restart the HTTP server on file change',
    alias: 'w',
  })
  declare watch?: boolean

  @flags.boolean({ description: 'Use polling to detect filesystem changes', alias: 'p' })
  declare poll?: boolean

  @flags.boolean({
    description: 'Clear the terminal for new logs after file change',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare clear?: boolean

  @flags.boolean({
    description: 'Start assets bundler dev server',
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
        `The "${dependency}" package is a development dependency and therefore you should use the serve command during development only.`,
        '',
        'If you are running your application in production, then use "node bin/server.js" command to start the HTTP server',
      ].join('\n')
    )
  }

  /**
   * Returns the assets bundler config
   */
  async #getAssetsBundlerConfig() {
    const assetsBundler = await detectAssetsBundler(this.app)
    return assetsBundler
      ? {
          enabled: this.assets === false ? false : true,
          driver: assetsBundler.name,
          cmd: assetsBundler.devServer.command,
          args: (assetsBundler.devServer.args || []).concat(this.assetsArgs || []),
        }
      : {
          enabled: false as const,
        }
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

    this.devServer = new assembler.DevServer(this.app.appRoot, {
      clearScreen: this.clear === false ? false : true,
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: [],
      assets: await this.#getAssetsBundlerConfig(),
      metaFiles: this.app.rcFile.metaFiles,
    })

    /**
     * Share command logger with assembler, so that CLI flags like --no-ansi has
     * similar impact for assembler logs as well.
     */
    this.devServer.setLogger(this.logger)

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
      const ts = await importTypeScript(this.app)
      if (!ts) {
        this.#logMissingDevelopmentDependency('typescript')
        this.exitCode = 1
        return
      }

      await this.devServer.startAndWatch(ts, { poll: this.poll || false })
    } else {
      await this.devServer.start()
    }
  }
}
