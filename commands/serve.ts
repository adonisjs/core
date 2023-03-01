/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '../modules/ace/main.js'
import { CommandOptions } from '../types/ace.js'

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

  /**
   * Imports assembler and displays a human readable debugging message
   */
  async #importAssembler(): Promise<typeof import('@adonisjs/assembler') | undefined> {
    try {
      return await this.app.import('@adonisjs/assembler')
    } catch {
      this.logger.error(
        [
          'Unable to import "@adonisjs/assembler"',
          '',
          'The "@adonisjs/assembler" package is a development dependency and therefore you should use the serve command during development only.',
          '',
          'If you are running your application in production, then use "node bin/server.js" command to start the HTTP server',
        ].join('\n')
      )
      this.exitCode = 1
    }
  }

  /**
   * Imports typescript and displays a human readable debugging message
   */
  async #importTypeScript() {
    try {
      return await this.app.import('typescript')
    } catch {
      this.logger.error(
        [
          'Unable to import "typescript"',
          '',
          'The "typescript" package is a development dependency and therefore you should use the serve command during development only.',
          '',
          'If you are running your application in production, then use "node bin/server.js" command to start the HTTP server',
        ].join('\n')
      )
      this.exitCode = 1
    }
  }

  /**
   * Runs the HTTP server
   */
  async run() {
    const assembler = await this.#importAssembler()
    if (!assembler) {
      return
    }

    const devServer = new assembler.DevServer(this.app.appRoot, {
      nodeArgs: this.parsed.nodeArgs,
      scriptArgs: [],
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
      const ts = await this.#importTypeScript()
      if (!ts) {
        return
      }
      await devServer.startAndWatch(ts.default, { poll: this.poll || false })
    } else {
      await devServer.start()
    }
  }
}
