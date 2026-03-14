/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.ts'
import { type CommandOptions } from '../types/ace.ts'

/**
 * Command to start an interactive REPL (Read-Eval-Print Loop) session for AdonisJS.
 * The REPL provides a command-line interface where you can execute JavaScript code
 * in the context of your AdonisJS application, allowing you to interact with models,
 * services, and other application components in real-time.
 *
 * @example
 * ```
 * ace repl
 * ```
 */
export default class ReplCommand extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'repl'

  /**
   * The command description
   */
  static description =
    'Start an interactive REPL session with the application booted and IoC container available'

  /**
   * Command options configuration.
   * Requires the application to be started and keeps the process alive.
   */
  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  /**
   * Execute the command to start the REPL server.
   * Creates a REPL instance from the container and sets up an exit handler
   * that properly terminates the application when the REPL session ends.
   */
  async run() {
    const repl = await this.app.container.make('repl')
    repl.start()
    repl.server!.on('exit', async () => {
      await this.terminate()
    })
  }
}
