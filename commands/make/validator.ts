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
 * Command to create a new VineJS validator file.
 * Validators define reusable validation schemas for request validation,
 * and can be generated as simple validators or resource-based validators
 * with create and update schemas.
 *
 * @example
 * ```
 * ace make:validator UserValidator
 * ace make:validator PostValidator --resource
 * ace make:validator ContactValidator
 * ```
 */
export default class MakeValidator extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:validator'

  /**
   * The command description
   */
  static description = 'Create a new file to define VineJS validators'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the validator file to create
   */
  @args.string({ description: 'Name of the validator file' })
  declare name: string

  /**
   * Generate a resource validator with create and update schemas
   */
  @flags.boolean({
    description: 'Create a file with pre-defined validators for create and update actions',
  })
  declare resource: boolean

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * The stub template file to use for generating the validator
   */
  protected stubPath: string = 'make/validator/main.stub'

  /**
   * Prepare the command by selecting the appropriate stub based on options.
   * Uses a resource stub when generating validators for CRUD operations.
   */
  async prepare() {
    /**
     * Use resource stub
     */
    if (this.resource) {
      this.stubPath = 'make/validator/resource.stub'
    }
  }

  /**
   * Execute the command to create a new VineJS validator file.
   * Generates the validator with the appropriate stub template.
   */
  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )
  }
}
