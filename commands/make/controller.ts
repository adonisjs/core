/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseCommand from './_base.js'
import { args, flags } from '../../modules/ace/main.js'

/**
 * The make controller command to create an HTTP controller
 */
export default class MakeController extends BaseCommand {
  static commandName = 'make:controller'
  static description = 'Create a new HTTP controller class'

  @args.string({ description: 'The name of the controller' })
  declare name: string

  @flags.boolean({
    description: 'Convert controller class and file name to its singular form',
    alias: 'r',
  })
  declare singular: boolean

  @flags.boolean({
    description: 'Generate controller with resource actions',
    alias: 'r',
  })
  declare resource: boolean

  @flags.boolean({
    description: 'Generate controller with api resource actions',
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
     * Use resource stub
     */
    if (this.resource) {
      this.stubPath = 'make/controller/resource.stub'
    }

    /**
     * Use api stub
     */
    if (this.api) {
      this.stubPath = 'make/controller/api.stub'
    }

    /**
     * Log warning when both flags are used together
     */
    if (this.resource && this.api) {
      this.logger.warning('--api and --resource flags cannot be used together. Ignoring --resource')
    }
  }

  async run() {
    await this.generate(this.stubPath, {
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
