/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.js'
import { args } from '../../modules/ace/main.js'
import { BaseCommand } from '../../modules/ace/main.js'

/**
 * Make a new ace command
 */
export default class MakeCommand extends BaseCommand {
  static commandName = 'make:command'
  static description = 'Create a new ace command class'

  @args.string({ description: 'Name of the command' })
  declare name: string

  /**
   * The stub to use for generating the command class
   */
  protected stubPath: string = 'make/command/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
