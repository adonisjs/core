/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import ace from '@adonisjs/ace'
import { join, dirname } from 'path'
import { Ioc } from '@adonisjs/fold'
import { esmRequire, resolveFrom } from '@poppinss/utils'
import { Application } from '@adonisjs/application/build/standalone'

import { isMissingModuleError } from '../../utils'
import { AceRuntimeException } from './AceRuntimeException'

/**
 * Exposes the API to run core commands from `@adonisjs/assembler`.
 */
export class CoreCommands {
  /**
   * List of core commands
   */
  public static commandsList = Object.keys(CoreCommands.getManifestJSON())

  /**
   * Returns assembler manifest file for showing help
   */
  public static getManifestJSON () {
    try {
      return require('@adonisjs/assembler/build/ace-manifest.json')
    } catch (error) {
      return {}
    }
  }

  private _application: Application

  constructor (private _appRoot: string, private _ace: typeof ace) {
  }

  /**
   * Loading `.adonisrc.json` file with custom error handling when the file
   * is missing. With ace commands we always use `RuntimeException`, since
   * we handle it in a different way to show console friendly one liner
   * errors.
   */
  private _setupApplication () {
    let rcContents = {}

    try {
      rcContents = esmRequire(join(this._appRoot, '.adonisrc.json'))
    } catch (error) {
      if (isMissingModuleError(error)) {
        throw new AceRuntimeException('Make sure the project root has ".adonisrc.json"')
      }
      throw error
    }

    this._application = new Application(this._appRoot, new Ioc(), rcContents, {})
  }

  /**
   * Lazy load @adonisjs/assembler
   */
  private async _importAssembler (command: string) {
    try {
      return await import('@adonisjs/assembler')
    } catch (error) {
      if (isMissingModuleError(error)) {
        throw new AceRuntimeException(`Install "@adonisjs/assembler" to execute "${command}" command`)
      }

      throw error
    }
  }

  /**
   * Handle core commands
   */
  public async handle (argv: string[]) {
    this._setupApplication()
    await this._importAssembler(argv[0])

    const manifest = new this._ace.Manifest(dirname(resolveFrom(this._appRoot, '@adonisjs/assembler')))
    const kernel = new this._ace.Kernel(this._application)

    /**
     * Showing commands help
     */
    kernel.flag('help', async (value, _parsed, command) => {
      if (!value) {
        return
      }

      kernel.printHelp(command)
      process.exit(0)
    }, { alias: 'h' })

    kernel.useManifest(manifest)
    await kernel.handle(argv)
  }
}
