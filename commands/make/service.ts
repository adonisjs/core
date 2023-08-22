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
 * Make a new service class
 */
export default class MakeService extends BaseCommand {
  static commandName = 'make:service'
  static description = 'Create a new service class'

  @args.string({ description: 'Name of the service' })
  declare name: string

  /**
   * The stub to use for generating the service class
   */
  protected stubPath: string = 'make/service/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
