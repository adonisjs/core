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

/**
 * Command to create a new transformer class.
 * Transformers are used to serialize data objects (like models) into specific
 * formats for API responses, allowing you to control which fields are exposed
 * and how data is structured for clients.
 *
 * @example
 * ```
 * ace make:transformer User
 * ace make:transformer Post
 * ace make:transformer ProductTransformer
 * ```
 */
export default class MakeTransformer extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:transformer'

  /**
   * The command description
   */
  static description = 'Create a new transformer class'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the entity for which to generate the transformer
   */
  @args.string({ description: 'Entity name for which to generate the transformer' })
  declare name: string

  /**
   * The stub template file to use for generating the transformer class
   */
  protected stubPath: string = 'make/transformer/main.stub'

  /**
   * Execute the command to create a new transformer class.
   * Generates the transformer file with proper data serialization structure.
   */
  async run() {
    const codemods = await this.createCodemods()

    await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
      model: this.app.generators.createEntity(this.name),
    })
  }
}
