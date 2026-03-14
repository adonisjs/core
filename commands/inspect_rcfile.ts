/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.ts'

/**
 * Command to inspect and display the AdonisJS RC file contents with default values.
 * The RC file contains configuration for providers, preloads, commands, and other
 * application settings. This command formats and displays the contents in a readable JSON format.
 *
 * @example
 * ```
 * ace inspect:rcfile
 * ```
 */
export default class InspectRCFile extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'inspect:rcfile'

  /**
   * The command description
   */
  static description =
    'Display the resolved adonisrc.ts configuration as JSON, including providers, preloads, commands, and meta files'

  /**
   * Execute the command to display RC file contents.
   * Transforms provider, preload, and command entries to display their file paths
   * as strings and formats the output as readable JSON.
   */
  async run() {
    const { raw, providers, preloads, commands, ...rest } = this.app.rcFile
    this.logger.log(
      JSON.stringify(
        {
          ...rest,
          providers: providers.map((provider) => {
            return {
              ...provider,
              file: provider.file.toString(),
            }
          }),
          preloads: preloads.map((preload) => {
            return {
              ...preload,
              file: preload.file.toString(),
            }
          }),
          commands: commands.map((command) => {
            return command.toString()
          }),
        },
        null,
        2
      )
    )
  }
}
