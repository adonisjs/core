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
 * Make a new VineJS validator
 */
export default class MakeValidator extends BaseCommand {
  static commandName = 'make:validator'
  static description = 'Create a new VineJS validator'

  @args.string({ description: 'Name of the validator' })
  declare name: string

  /**
   * The stub to use for generating the validator
   */
  protected stubPath: string = 'make/validator/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
