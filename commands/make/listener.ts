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
 * Command to create a new event listener class.
 * Event listeners handle events dispatched by the application and can optionally
 * generate the corresponding event class automatically.
 *
 * @example
 * ```
 * ace make:listener UserRegistered
 * ace make:listener EmailSent --event=EmailSent
 * ace make:listener OrderCompleted --event=OrderEvent
 * ```
 */
export default class MakeListener extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:listener'

  /**
   * The command description
   */
  static description = 'Create a new event listener class'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the event listener class to create
   */
  @args.string({ description: 'Name of the event listener' })
  declare name: string

  /**
   * Generate an event class alongside the listener and bind them together
   */
  @flags.string({
    description: 'Generate an event class alongside the listener',
    alias: 'e',
  })
  declare event: string

  /**
   * The stub template file to use for generating the event listener
   */
  protected stubPath: string = 'make/listener/main.stub'

  /**
   * Prepare the command by selecting the appropriate stub based on options.
   * Uses a different stub when generating a listener for a specific event.
   */
  prepare() {
    if (this.event) {
      this.stubPath = 'make/listener/for_event.stub'
    }
  }

  /**
   * Execute the command to create a new event listener.
   * If an event is specified, creates the event class first,
   * then generates the listener with proper event binding.
   */
  async run() {
    const codemods = await this.createCodemods()

    if (this.event) {
      const { exitCode } = await this.kernel.exec('make:event', [this.event])

      /**
       * Create listener only when make:event is completed successfully
       */
      if (exitCode === 0) {
        const eventEntity = this.app.generators.createEntity(this.event)
        await codemods.makeUsingStub(stubsRoot, this.stubPath, {
          event: eventEntity,
          flags: this.parsed.flags,
          entity: this.app.generators.createEntity(this.name),
        })
      }

      return
    }

    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
