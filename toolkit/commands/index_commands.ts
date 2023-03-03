/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { args, BaseCommand, IndexGenerator } from '@adonisjs/ace'

/**
 * Generates index of commands with a loader. Must be called against
 * the TypeScript compiled output.
 */
export default class IndexCommand extends BaseCommand {
  static commandName = 'index'
  static description: string = 'Create an index of commands along with a lazy loader'

  @args.string({ description: 'Relative path from cwd to the commands directory' })
  declare commandsDir: string

  async run(): Promise<any> {
    await new IndexGenerator(join(process.cwd(), this.commandsDir)).generate()
  }
}
