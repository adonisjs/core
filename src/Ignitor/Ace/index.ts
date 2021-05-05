/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { App } from './App'
import { GenerateManifest } from './GenerateManifest'

/**
 * Exposes the API to execute ace commands.
 */
export class Ace {
  constructor(private appRoot: string) {}

  /**
   * Handles the ace command
   */
  public async handle(argv: string[]) {
    process.env.ADONIS_ACE_CWD = this.appRoot

    if (argv[0] === 'generate:manifest' && !argv.includes('--help')) {
      await new GenerateManifest(this.appRoot).handle()
      return
    }

    /**
     * Proxy over to application commands
     */
    await new App(this.appRoot).handle(argv)
  }
}
