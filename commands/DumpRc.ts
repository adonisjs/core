/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/ace'

/**
 * A command to display a list of routes
 */
export default class DumpRcFile extends BaseCommand {
  public static commandName = 'dump:rcfile'
  public static description = 'Dump contents of .adonisrc.json file along with defaults'

  /**
   * Log message
   */
  private log(message: string) {
    if (this.application.environment === 'test') {
      this.logger.log(message)
    } else {
      console.log(message)
    }
  }

  public async run() {
    this.log(JSON.stringify(this.application.rcFile, null, 2))
  }
}
