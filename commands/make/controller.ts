/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { stubsRoot } from '../../stubs/main.js'
import { args, flags, BaseCommand } from '../../modules/ace/main.js'

/**
 * The make controller command to create an HTTP controller
 */
export default class MakeController extends BaseCommand {
  static commandName = 'make:controller'
  static description = 'Create a new HTTP controller class'

  @args.string({ description: 'The name of the controller' })
  declare name: string

  @args.spread({ description: 'Create controller with custom method names', required: false })
  declare actions?: string[]

  @flags.boolean({
    description: 'Generate controller in singular form',
    alias: 's',
  })
  declare singular: boolean

  @flags.boolean({
    description: 'Generate controller with methods to perform CRUD actions on a resource',
    alias: 'r',
  })
  declare resource: boolean

  @flags.boolean({
    description: 'Generate resourceful controller with the "edit" and the "create" methods',
    alias: 'a',
  })
  declare api: boolean

  /**
   * The stub to use for generating the controller
   */
  protected stubPath: string = 'make/controller/main.stub'

  /**
   * Preparing the command state
   */
  async prepare() {
    /**
     * Use actions stub
     */
    if (this.actions) {
      this.stubPath = 'make/controller/actions.stub'
    }

    /**
     * Use resource stub
     */
    if (this.resource) {
      if (this.actions) {
        this.logger.warning('Cannot use --resource flag with actions. Ignoring --resource')
      } else {
        this.stubPath = 'make/controller/resource.stub'
      }
    }

    /**
     * Use api stub
     */
    if (this.api) {
      if (this.actions) {
        this.logger.warning('Cannot use --api flag with actions. Ignoring --api')
      } else {
        this.stubPath = 'make/controller/api.stub'
      }
    }

    /**
     * Log warning when both flags are used together
     */
    if (this.resource && this.api && !this.actions) {
      this.logger.warning('--api and --resource flags cannot be used together. Ignoring --resource')
    }
  }

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      actions: this.actions?.map((action) => string.camelCase(action)),
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
