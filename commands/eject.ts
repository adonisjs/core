/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand, flags } from '../modules/ace/main.ts'
import stringHelpers from '../src/helpers/string.ts'

/**
 * Command to eject scaffolding stubs from packages to your application root.
 * This allows you to customize templates used by make commands and other
 * code generation features by copying them to your local application.
 *
 * @example
 * ```
 * ace eject make/controller
 * ace eject make/controller --pkg=@adonisjs/lucid
 * ace eject stubs/
 * ```
 */
export default class Eject extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'eject'

  /**
   * The command description
   */
  static description =
    'Copy scaffolding stubs from a package to your application for customization. Stubs are templates used by make:* commands'

  /**
   * Path to the stubs directory or a single stub file to eject
   */
  @args.string({ description: 'Path to the stubs directory or a single stub file' })
  declare stubPath: string

  /**
   * Package name to search for stubs. Defaults to @adonisjs/core
   */
  @flags.string({
    description: 'Mention package name for searching stubs',
    default: '@adonisjs/core',
  })
  declare pkg: string

  /**
   * Execute the command to eject stubs from the specified package.
   * Copies the stubs to the application root and logs success messages
   * for each ejected file.
   */
  async run() {
    const stubs = await this.app.stubs.create()
    const copied = await stubs.copy(this.stubPath, {
      pkg: this.pkg,
    })

    copied.forEach((stubPath) => {
      this.logger.success(`eject ${stringHelpers.toUnixSlash(this.app.relativePath(stubPath))}`)
    })
  }
}
