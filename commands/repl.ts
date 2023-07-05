/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { runNode } from '../src/internal_helpers.js'

/**
 * Repl command is used to run the REPL server.
 * Under the hood we just run the "bin/repl.ts"
 */
export default class ReplCommand extends BaseCommand {
  static commandName = 'repl'
  static description = 'Start a new REPL session'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  /**
   * Start the REPL server process
   */
  async run() {
    const { execaNode } = await import('execa')

    runNode(execaNode, this.app.appRoot, {
      script: 'bin/repl.ts',
      nodeArgs: [],
      scriptArgs: [],
    })
  }
}
