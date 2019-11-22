/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { exists } from 'fs'
import ace from '@adonisjs/ace'
import { Bootstrapper } from '../Bootstrapper'
import { RuntimeException } from './RuntimeException'

/**
 * Exposes the API to generate the manifest file
 */
export class GenerateManifest {
  private _bootstrapper = new Bootstrapper(this._buildRoot)

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor (
    private _buildRoot: string,
    private _ace: typeof ace,
  ) {
  }

  /**
   * Raises human friendly error when the `build` directory is
   * missing during `generate:manifest` command.
   */
  private _ensureBuildRoot () {
    return new Promise((resolve, reject) => {
      exists(this._buildRoot, (exists) => {
        if (!exists) {
          reject(new RuntimeException('Make sure to compile the code before running "node ace generate:manifest"'))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Generates the manifest file for commands
   */
  public async handle () {
    await this._ensureBuildRoot()

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
    await new this._ace.Manifest(this._buildRoot).generate(commands)

    /**
     * Success
     */
    this._ace.logger.create('ace-manifest.json')
  }
}
