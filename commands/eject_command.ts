/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { args, BaseCommand, flags } from '../modules/ace/main.js'

/**
 * The eject command is used to eject templates to the user
 * application codebase for customizing them
 */
export default class EjectCommand extends BaseCommand {
  static commandName = 'eject'
  static description = 'Eject stub to your application codebase'

  @args.string({ description: 'Path to the stubs directory or a single stub file' })
  declare stubPath: string

  @flags.string({
    description: 'Mention package name for searching stubs',
    default: '@adonisjs/core',
  })
  declare pkg: string

  async run() {
    const copied = await this.app.stubs.copy(this.stubPath, {
      pkg: this.pkg,
    })

    copied.forEach((stubPath) => {
      this.logger.success(`eject ${this.app.relativePath(stubPath)}`)
    })
  }
}
