/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.js'
import { args, flags, BaseCommand } from '../../modules/ace/main.js'

/**
 * The make listener command to create a class based event
 * listener
 */
export default class MakeListener extends BaseCommand {
  static commandName = 'make:listener'
  static description = 'Create a new event listener class'

  @args.string({ description: 'Name of the event listener' })
  declare name: string

  @flags.string({
    description: 'Generate an event class alongside the listener',
    alias: 'e',
  })
  declare event: string

  /**
   * The stub to use for generating the event listener
   */
  protected stubPath: string = 'make/listener/main.stub'

  prepare() {
    if (this.event) {
      this.stubPath = 'make/listener/for_event.stub'
    }
  }

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
