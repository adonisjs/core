/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.js'
import { CommandOptions } from '../types/ace.js'

/**
 * The ReplCommand class is used to start the Repl server
 */
export default class ReplCommand extends BaseCommand {
  static commandName = 'repl'
  static description = 'Start a new REPL session'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  /**
   * Starts the REPL server process
   */
  async run() {
    const repl = await this.app.container.make('repl')
    repl.start()
    repl.server!.on('exit', async () => {
      await this.terminate()
    })
  }
}
