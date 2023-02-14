/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseCommand from './_base.js'
import { args } from '../../modules/ace/main.js'

/**
 * The make event command to create a class based event
 */
export default class MakeEvent extends BaseCommand {
  static commandName = 'make:event'
  static description = 'Create a new event class'

  @args.string({ description: 'Name of the event' })
  declare name: string

  /**
   * The stub to use for generating the event
   */
  protected stubPath: string = 'make/event/main.stub'

  async run() {
    await this.generate(this.stubPath, {
      entity: this.app.generators.createEntity(this.name),
    })
  }
}
