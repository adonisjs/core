/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import ace from '@adonisjs/ace'
import { Bootstrapper } from '../Bootstrapper'
import { exitProcess } from '../../utils'

/**
 * Exposes the API to generate the manifest file
 */
export class GenerateManifest {
  private _bootstrapper = new Bootstrapper(this._sourceRoot)

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor (
    private _sourceRoot: string,
    private _ace: typeof ace,
  ) {
  }

  /**
   * Generates the manifest file for commands
   */
  public async handle () {
    this._bootstrapper.setup()
    const application = this._bootstrapper.application
    const commands = application.rcFile.commands

    /**
     * We register providers and autoloads to avoid runtime
     * import exception when loading commands to generate
     * the manifest file
     */
    this._bootstrapper.registerProviders(true)
    this._bootstrapper.registerAutoloads()

    /**
     * Generate file
     */
    await new this._ace.Manifest(this._sourceRoot).generate(commands)

    /**
     * Success
     */
    this._ace.logger.create('.adonisrc.json')
    exitProcess(0)
  }
}
