/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { args, BaseCommand, flags } from '../modules/ace/main.js'

/**
 * The eject command is used to eject templates to the user
 * application codebase for customizing them
 */
export default class Eject extends BaseCommand {
  static commandName = 'eject'
  static description = 'Eject scaffolding stubs to your application root'

  @args.string({ description: 'Path to the stubs directory or a single stub file' })
  declare stubPath: string

  @flags.string({
    description: 'Mention package name for searching stubs',
    default: '@adonisjs/core',
  })
  declare pkg: string

  async run() {
    const stubs = await this.app.stubs.create()
    const copied = await stubs.copy(this.stubPath, {
      pkg: this.pkg,
    })

    copied.forEach((stubPath) => {
      this.logger.success(`eject ${slash(this.app.relativePath(stubPath))}`)
    })
  }
}
