/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '../modules/ace/main.js'

/**
 * Prints the RcFile file contents to the terminal
 */
export default class InspectRCFile extends BaseCommand {
  static commandName = 'inspect:rcfile'
  static description = 'Inspect the RC file with its default values'

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
