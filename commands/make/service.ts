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
 * Make a new service class
 *
 * @example
 * ```
 * ace make:service UserService
 * ace make:service AuthService
 * ace make:service User/ProfileService
 * ```
 */
export default class MakeService extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:service'
  /**
   * The command description
   */
  static description = 'Create a new service class'

  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the service
   */
  @args.string({ description: 'Name of the service' })
  declare name: string

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * The stub to use for generating the service class
   */
  protected stubPath: string = 'make/service/main.stub'

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
