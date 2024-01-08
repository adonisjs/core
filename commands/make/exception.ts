/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.js'
import { args, BaseCommand } from '../../modules/ace/main.js'

/**
 * Make a new exception class
 */
export default class MakeException extends BaseCommand {
  static commandName = 'make:exception'
  static description = 'Create a new custom exception class'

  @args.string({ description: 'Name of the exception' })
  declare name: string

  /**
   * The stub to use for generating the command class
   */
  protected stubPath: string = 'make/exception/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
