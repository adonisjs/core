/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.ts'
import { args, flags } from '../../modules/ace/main.ts'
import { BaseCommand } from '../../modules/ace/main.ts'

/**
 * Command to create a new Ace command class.
 * Ace commands are CLI commands that can be executed via the `ace` binary,
 * allowing you to create custom functionality for your application's command line interface.
 *
 * @example
 * ```
 * ace make:command SendEmails
 * ace make:command ProcessPayments
 * ace make:command GenerateReports
 * ace make:command CleanupFiles
 * ```
 */
export default class MakeCommand extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:command'

  /**
   * The command description
   */
  static description = 'Create a new ace command class'

  /**
   * Name of the command class to create
   */
  @args.string({ description: 'Name of the command' })
  declare name: string

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * The stub template file to use for generating the command class
   */
  protected stubPath: string = 'make/command/main.stub'

  /**
   * Execute the command to create a new Ace command class.
   * Generates the command file with proper CLI command structure.
   */
  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )
  }
}
