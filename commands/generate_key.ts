/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/utils/string'
import { EnvEditor } from '@adonisjs/env/editor'
import { BaseCommand, flags } from '../modules/ace/main.ts'

/**
 * The generate key command is used to generate the app key
 * and write it inside the .env file.
 *
 * @example
 * ```
 * ace generate:key
 * ace generate:key --show
 * ace generate:key --force
 * ```
 */
export default class GenerateKey extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'generate:key'
  /**
   * The command description
   */
  static description =
    'Generate a cryptographically secure APP_KEY and write it to the .env file. Use --show to print without writing'

  /**
   * Display the key on the terminal, instead of writing it to .env file
   */
  @flags.boolean({
    description: 'Display the key on the terminal, instead of writing it to .env file',
  })
  declare show: boolean

  /**
   * Force update .env file in production environment
   */
  @flags.boolean({
    description: 'Force update .env file in production environment',
  })
  declare force: boolean

  async run() {
    let writeToFile = process.env.NODE_ENV !== 'production'
    if (this.force) {
      writeToFile = true
    }

    if (this.show) {
      writeToFile = false
    }

    const secureKey = string.random(32)

    if (writeToFile) {
      const editor = await EnvEditor.create(this.app.appRoot)
      editor.add('APP_KEY', secureKey, true)
      await editor.save()
      this.logger.action('add APP_KEY to .env').succeeded()
    } else {
      this.logger.log(`APP_KEY = ${secureKey}`)
    }
  }
}
