/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.ts'
import { args, flags, BaseCommand } from '../../modules/ace/main.ts'
import { type CommandOptions } from '../../types/ace.ts'

/**
 * Command to create a new event class.
 * Events are data objects that encapsulate information about something
 * that happened in your application and can be dispatched to listeners.
 *
 * @example
 * ```
 * ace make:event UserRegistered
 * ace make:event OrderCompleted
 * ace make:event EmailSent
 * ```
 */
export default class MakeEvent extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:event'

  /**
   * The command description
   */
  static description =
    'Create a new event class in app/events. Events are dispatched via emitter and handled by listeners'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the event class to create
   */
  @args.string({ description: 'Name of the event' })
  declare name: string

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * Forcefully overwrite existing files
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files', alias: 'f' })
  declare force: boolean

  /**
   * The stub template file to use for generating the event class
   */
  protected stubPath: string = 'make/event/main.stub'

  /**
   * Execute the command to create a new event class.
   * Generates the event file with proper event structure.
   */
  async run() {
    const codemods = await this.createCodemods()
    codemods.overwriteExisting = this.force === true
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
