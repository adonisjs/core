/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { exists } from 'fs'
import adonisAce from '@adonisjs/ace'
import { Bootstrapper } from '../Bootstrapper'
import { AceRuntimeException } from './AceRuntimeException'

/**
 * Exposes the API to generate the manifest file
 */
export class GenerateManifest {
  private bootstrapper = new Bootstrapper(this.buildRoot, false)

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor (
    private buildRoot: string,
    private ace: typeof adonisAce,
  ) {
  }

  /**
   * Returns manifest object for showing help
   */
  public static getManifestJSON () {
    return {
      'generate:manifest': {
        commandName: 'generate:manifest',
        description: 'Generate manifest file to execute ace commands',
        args: [],
        flags: [],
        settings: {},
      },
    }
  }

  /**
   * Raises human friendly error when the `build` directory is
   * missing during `generate:manifest` command.
   */
  private ensureBuildRoot () {
    return new Promise((resolve, reject) => {
      exists(this.buildRoot, (hasFile) => {
        if (!hasFile) {
          reject(new AceRuntimeException('Make sure to compile the code before running "node ace generate:manifest"'))
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
    await this.ensureBuildRoot()

    this.bootstrapper.setup()
    const application = this.bootstrapper.application
    const commands = application.rcFile.commands

    /**
     * Register aliases for imports to work
     */
    this.bootstrapper.registerAliases()

    /**
     * We register providers and autoloads to avoid runtime
     * import exception when loading commands to generate
     * the manifest file
     */
    this.bootstrapper.registerProviders(true)

    /**
     * Generate file
     */
    await new this.ace.Manifest(this.buildRoot).generate(commands)

    /**
     * Success
     */
    this.ace.logger.create('ace-manifest.json')
  }
}
