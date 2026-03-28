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

/**
 * Command to create a new Edge.js template file.
 * Edge templates are used for rendering HTML views in your web application,
 * supporting layouts, partials, components, and template inheritance.
 *
 * @example
 * ```
 * ace make:view home
 * ace make:view users/profile
 * ace make:view components/navbar
 * ace make:view layouts/app
 * ```
 */
export default class MakeView extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:view'

  /**
   * The command description
   */
  static description = 'Create a new Edge.js template file in resources/views'

  /**
   * Name of the template file to create
   */
  @args.string({ description: 'Name of the template' })
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
   * The stub template file to use for generating the Edge template
   */
  protected stubPath: string = 'make/view/main.stub'

  /**
   * Execute the command to create a new Edge.js template file.
   * Generates the template file in the views directory.
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
