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
import { SignalsListener } from '../SignalsListener'
import { AceRuntimeException } from './AceRuntimeException'

/**
 * Exposes the API to execute app commands registered under
 * the manifest file.
 */
export class AppCommands {
  private bootstrapper = new Bootstrapper(this.buildRoot)

  /**
   * Whether or not the app was wired. App is only wired, when
   * loadApp inside the command setting is true.
   */
  private wired = false

  /**
   * Signals listener to listen for exit signals and kill command
   */
  private signalsListener = new SignalsListener()

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor (
    private buildRoot: string,
    private ace: typeof adonisAce,
    private additionalManifestCommands: any,
  ) {
  }

  /**
   * Print commands help
   */
  private printHelp (kernel: adonisAce.Kernel, command?: any): never {
    /**
     * Updating manifest commands object during help
     */
    Object.keys(this.additionalManifestCommands).forEach((commandName) => {
      kernel.manifestCommands![commandName] = this.additionalManifestCommands[commandName]
    })

    kernel.printHelp(command)
    process.exit(0)
  }

  /**
   * Raises human friendly error when the `build` directory is
   * missing during `generate:manifest` command.
   */
  private ensureBuildRoot (command: string) {
    command = command || '<command>'
    return new Promise((resolve, reject) => {
      exists(this.buildRoot, (hasFile) => {
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
  private addKernelHooks (kernel: adonisAce.Kernel) {
    kernel.before('find', async (command) => {
      /**
       * Since commands can internally execute other commands. We should not re-wire
       * the application when this hook is invoked for more than one command inside
       * a single process.
       */
      if (command && command.settings.loadApp && !this.wired) {
        await this.wire()
        this.bootstrapper.application.isReady = true
      }
    })

    kernel.before('run', async () => {
      if (this.wired) {
        await this.bootstrapper.executeReadyHooks()
      }
    })
  }

  /**
   * Adding flags
   */
  private addKernelFlags (kernel: adonisAce.Kernel) {
    /**
     * Showing help including core commands
     */
    kernel.flag('help', async (value, _, command) => {
      if (!value) {
        return
      }

      this.printHelp(kernel, command)
    }, { alias: 'h' })

    /**
     * Showing app and AdonisJs version
     */
    kernel.flag('version', async (value) => {
      if (!value) {
        return
      }

      const appVersion = this.bootstrapper.application.version
      const adonisVersion = this.bootstrapper.application.adonisVersion

      console.log('App version', appVersion ? appVersion.version : 'NA')
      console.log('Framework version', adonisVersion ? adonisVersion.version : 'NA')
      process.exit(0)
    }, { alias: 'v' })
  }

  /**
   * Boot the application.
   */
  private async wire () {
    if (this.wired) {
      return
    }

    this.wired = true

    /**
     * Do not change sequence
     */
    this.bootstrapper.registerProviders(true)
    this.bootstrapper.registerAliases()
    await this.bootstrapper.bootProviders()
    this.bootstrapper.registerPreloads()
  }

  /**
   * Handle application command
   */
  public async handle (argv: string[]) {
    await this.ensureBuildRoot(argv[0])
    this.bootstrapper.setup()

    const manifest = new this.ace.Manifest(this.buildRoot)
    const kernel = new this.ace.Kernel(this.bootstrapper.application)
    this.addKernelHooks(kernel)
    this.addKernelFlags(kernel)

    kernel.useManifest(manifest)
    await kernel.preloadManifest()

    /**
     * Print help when no arguments have been passed
     */
    if (!argv.length) {
      this.printHelp(kernel)
    }

    await kernel.handle(argv)

    this.signalsListener.listen(async () => {
      if (this.wired) {
        await this.bootstrapper.executeShutdownHooks()
      }
    })
  }
}
