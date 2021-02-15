/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/ace'
import { string } from '@poppinss/utils/build/helpers'

/**
 * A command to generate a secure app key
 */
export default class GenerateKey extends BaseCommand {
  public static commandName = 'generate:key'
  public static description = 'Generate a new APP_KEY secret'

  public async run() {
    const secret = string.generateRandom(32)
    console.log(this.colors.green(secret))

    console.log(
      this.colors.gray(
        '  > During development, you may want to set the above secret as "APP_KEY" inside the .env file'
      )
    )
  }
}
