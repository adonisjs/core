/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import lodash from '@poppinss/utils/lodash'
import { BaseCommand } from '../modules/ace/main.js'

/**
 * Prints the RcFile file contents to the terminal
 */
export default class InspectRCFile extends BaseCommand {
  static commandName = 'inspect:rcfile'
  static description = 'Inspect the RC file with its default values'

  async run() {
    this.logger.log(JSON.stringify(lodash.omit(this.app.rcFile, ['raw']), null, 2))
  }
}
