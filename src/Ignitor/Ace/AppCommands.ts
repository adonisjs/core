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
import { SignalsListener } from '../SignalsListener'
import { AceRuntimeException } from './AceRuntimeException'

/**
 * Exposes the API to execute app commands registered under
 * the manifest file.
 */
export class AppCommands {
  private _bootstrapper = new Bootstrapper(this._buildRoot)

  /**
   * Whether or not the app was wired. App is only wired, when
   * loadApp inside the command setting is true.
   */
  private _wired = false

  /**
   * Signals listener to listen for exit signals and kill command
   */
  private _signalsListener = new SignalsListener()

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor (
    private _buildRoot: string,
    private _ace: typeof ace,
    private _additionalManifestCommands: any,
  ) {
  }

  /**
   * Raises human friendly error when the `build` directory is
   * missing during `generate:manifest` command.
   */
  private _ensureBuildRoot (command: string) {
    command = command || '<command>'
    return new Promise((resolve, reject) => {
      exists(this._buildRoot, (hasFile) => {
        if (!hasFile) {
          reject(new AceRuntimeException(`Make sure to compile the code before running "node ace ${command}"`))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Hooks into kernel lifecycle events to conditionally
   * load the app.
   */
  private _addKernelHooks (kernel: ace.Kernel) {
    kernel.before('find', async (command) => {
      if (command && command.settings.loadApp) {
        await this._wire()
        this._bootstrapper.application.isReady = true
      }
    })

    kernel.before('run', async () => {
      if (this._wired) {
        await this._bootstrapper.executeReadyHooks()
      }
    })
  }

  /**
   * Adding flags
   */
  private _addKernelFlags (kernel: ace.Kernel) {
    /**
     * Showing help including core commands
     */
    kernel.flag('help', async (value, _parsed, command) => {
      if (!value) {
        return
      }

      /**
       * Updating manifest commands object during help
       */
      Object.keys(this._additionalManifestCommands).forEach((commandName) => {
        kernel.manifestCommands![commandName] = this._additionalManifestCommands[commandName]
      })

      kernel.printHelp(command)
      process.exit(0)
    }, { alias: 'h' })

    /**
     * Showing app and AdonisJs version
     */
    kernel.flag('version', async (value) => {
      if (!value) {
        return
      }

      const appVersion = this._bootstrapper.application.version
      const adonisVersion = this._bootstrapper.application.adonisVersion

      console.log('App version', appVersion ? appVersion.version : 'NA')
      console.log('Framework version', adonisVersion ? adonisVersion.version : 'NA')
      process.exit(0)
    }, { alias: 'v' })
  }

  /**
   * Boot the application.
   */
  private async _wire () {
    if (this._wired) {
      return
    }

    this._wired = true

    /**
     * Do not change sequence
     */
    this._bootstrapper.registerProviders(true)
    this._bootstrapper.registerAliases()
    await this._bootstrapper.bootProviders()
    this._bootstrapper.registerPreloads()
  }

  /**
   * Handle application command
   */
  public async handle (argv: string[]) {
    await this._ensureBuildRoot(argv[0])
    this._bootstrapper.setup()

    const manifest = new this._ace.Manifest(this._buildRoot)
    const kernel = new this._ace.Kernel(this._bootstrapper.application)
    this._addKernelHooks(kernel)
    this._addKernelFlags(kernel)

    kernel.useManifest(manifest)
    await kernel.preloadManifest()
    await kernel.handle(argv)

    this._signalsListener.listen(async () => {
      if (this._wired) {
        await this._bootstrapper.executeShutdownHooks()
      }
    })
  }
}
