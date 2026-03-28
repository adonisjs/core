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
 * Command to create a new custom exception class.
 * Custom exceptions allow you to define specific error types for your application
 * with custom error messages, status codes, and error handling logic.
 *
 * @example
 * ```
 * ace make:exception ValidationException
 * ace make:exception UnauthorizedException
 * ace make:exception ResourceNotFoundException
 * ```
 */
export default class MakeException extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:exception'

  /**
   * The command description
   */
  static description =
    'Create a new custom exception class in app/exceptions with handle and report methods'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Name of the exception class to create
   */
  @args.string({ description: 'Name of the exception' })
  declare name: string

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * Forcefully overwrite existing files
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files', alias: 'f' })
  declare force: boolean

  /**
   * The stub template file to use for generating the exception class
   */
  protected stubPath: string = 'make/exception/main.stub'

  /**
   * Execute the command to create a new custom exception class.
   * Generates the exception file with proper error handling structure.
   */
  async run() {
    const codemods = await this.createCodemods()
    codemods.overwriteExisting = this.force === true
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
