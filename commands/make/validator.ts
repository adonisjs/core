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
 * Make a new VineJS validator
 */
export default class MakeValidator extends BaseCommand {
  static commandName = 'make:validator'
  static description = 'Create a new file to define VineJS validators'

  @args.string({ description: 'Name of the validator file' })
  declare name: string

  @flags.boolean({
    description: 'Create a file with pre-defined validators for create and update actions',
  })
  declare resource: boolean

  /**
   * The stub to use for generating the validator
   */
  protected stubPath: string = 'make/validator/main.stub'

  /**
   * Preparing the command state
   */
  async prepare() {
    /**
     * Use resource stub
     */
    if (this.resource) {
      this.stubPath = 'make/validator/resource.stub'
    }
  }

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
