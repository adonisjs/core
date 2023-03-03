/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

  static options: CommandOptions = {
    staysAlive: true,
  }

  @flags.boolean({ description: 'Watch filesystem and restart the HTTP server on file change' })
  declare watch?: boolean

  @flags.boolean({ description: 'Use polling to detect filesystem changes' })
  declare poll?: boolean

  @flags.boolean({
    description: 'Start assets bundler dev server',
    showNegatedVariantInHelp: true,
    default: true,
  })
  declare assets?: boolean

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
   * Runs the HTTP server
   */
  async run() {
    const assembler = await importAssembler(this.app)
    if (!assembler) {
      this.#logMissingDevelopmentDependency('@adonisjs/assembler')
      this.exitCode = 1
      return
    }

    const assetsBundler = await detectAssetsBundler(this.app)
    const devServer = new assembler.DevServer(this.app.appRoot, {
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: [],
      assets: assetsBundler
        ? {
            serve: this.assets === false ? false : true,
            driver: assetsBundler.name,
            cmd: assetsBundler.devServerCommand,
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
    devServer.setLogger(this.logger)

    /**
     * Exit command when the dev server is closed
     */
    devServer.onClose((exitCode) => {
      this.exitCode = exitCode
    })

    /**
     * Exit command when the dev server crashes
     */
    devServer.onError(() => {
      this.exitCode = 1
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

      await devServer.startAndWatch(ts, { poll: this.poll || false })
    } else {
      await devServer.start()
    }
  }
}
