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
 * The make middleware command to create a new middleware
 * class.
 */
export default class MakeMiddleware extends BaseCommand {
  static commandName = 'make:middleware'
  static description = 'Create a new middleware class'

  @args.string({ description: 'Name of the middleware' })
  declare name: string

  /**
   * The stub to use for generating the middleware
   */
  protected stubPath: string = 'make/middleware/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
