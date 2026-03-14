/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { stubsRoot } from '../../stubs/main.ts'
import { args, flags, BaseCommand } from '../../modules/ace/main.ts'
import { type CommandOptions } from '../../types/ace.ts'

/**
 * The make controller command to create an HTTP controller
 *
 * @example
 * ```
 * ace make:controller User
 * ace make:controller User store update
 * ace make:controller User --resource
 * ace make:controller User --api
 * ace make:controller User --singular
 * ```
 */
export default class MakeController extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:controller'
  /**
   * The command description
   */
  static description =
    'Create a new HTTP controller class in app/controllers. Use --resource for CRUD methods or --api for API-only CRUD (no create/edit)'

  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the controller
   */
  @args.string({ description: 'The name of the controller' })
  declare name: string

  /**
   * Create controller with custom method names
   */
  @args.spread({ description: 'Create controller with custom method names', required: false })
  declare actions?: string[]

  /**
   * Generate controller in singular form
   */
  @flags.boolean({
    description: 'Generate controller in singular form',
    alias: 's',
  })
  declare singular: boolean

  /**
   * Generate resourceful controller with methods to perform CRUD actions on a resource
   */
  @flags.boolean({
    description:
      'Generate resourceful controller with methods to perform CRUD actions on a resource',
    alias: 'r',
  })
  declare resource: boolean

  /**
   * Generate resourceful controller without the "edit" and the "create" methods
   */
  @flags.boolean({
    description: 'Generate resourceful controller without the "edit" and the "create" methods',
    alias: 'a',
  })
  declare api: boolean

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

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
    await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        actions: this.actions?.map((action) => string.camelCase(action)),
        entity: this.app.generators.createEntity(this.name),
        singular: this.singular,
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )
  }
}
