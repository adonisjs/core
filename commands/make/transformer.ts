/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.ts'
import { args, flags, BaseCommand } from '../../modules/ace/main.ts'
import { type CommandOptions } from '../../types/ace.ts'

export default class MakeTransformer extends BaseCommand {
  static commandName = 'make:transformer'
  static description = 'Create a new transformer class'

  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  @args.string({ description: 'Entity name for which to generate the transformer' })
  declare name: string

  protected stubPath: string = 'make/transformer/main.stub'

  async run() {
    const codemods = await this.createCodemods()

    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
      model: this.app.generators.createEntity(this.name),
    })
  }
}
