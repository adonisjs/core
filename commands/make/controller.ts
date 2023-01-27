/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/index.js'
import { BaseCommand, args, flags } from '../../modules/ace/main.js'

export default class MakeControllerCommand extends BaseCommand {
  static commandName: string = 'make:controller'
  static description: string = 'Create a new HTTP controller'

  @args.string({ description: 'The name of the controller' })
  declare name: string

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
  stub: string = 'make/controller/main.stub'

  async prepare() {
    if (this.resource) {
      this.stub = 'make/controller/resource.stub'
    }

    if (this.api) {
      this.stub = 'make/controller/resource.stub'
      if (this.resource) {
        this.logger.warning(
          '--api and --resource flags cannot be used together. Ignoring --resource'
        )
      }
    }
  }

  async run() {
    const stub = await this.app.stubs.build('make/controller/main.stub', {
      source: stubsRoot,
    })

    const output = await stub.generate({
      entity: this.app.generators.createEntity(this.name),
      flags: this.parsed.flags,
    })

    const entityFileName = this.app.relativePath(output.destination)
    if (output.status === 'skipped') {
      return this.logger.action(`create ${entityFileName}`).skipped(output.skipReason)
    }

    this.logger.action(`create ${entityFileName}`).succeeded()
  }

  async completed() {
    if (this.error) {
      this.logger.error('Unable to create controller')
      this.logger.fatal(this.error)
      return true
    }
  }
}
