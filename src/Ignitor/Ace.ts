/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Hooks } from '@poppinss/hooks'

import { Ignitor } from './index'
import { ErrorHandler } from './ErrorHandler'

/**
 * Exposes the API to execute ace commands
 */
export class Ace {
  private _hooks = new Hooks()

  constructor (private _ignitor: Ignitor) {
  }

  /**
   * Exit process conditionally
   */
  private _exitProcess (signal) {
    if (process.env.NODE_ENV === 'testing') {
      return
    }
    process.exit(signal)
  }

  /**
   * Prints the ascii logo
   */
  private _dumpAsciiLogo () {
    // tslint:disable-next-line: max-line-length quotemark
    console.log("    _       _             _         _     \n   / \\   __| | ___  _ __ (_)___    | |___ \n  / _ \\ / _` |/ _ \\| '_ \\| / __|_  | / __|\n / ___ \\ (_| | (_) | | | | \\__ \\ |_| \\__ \\\n/_/   \\_\\__,_|\\___/|_| |_|_|___/\\___/|___/\n")
  }

  /**
   * Registers `help` and `version` global flags
   */
  private _registerGlobalFlags (kernel: any) {
    kernel.flag('help', (value, _options, command) => {
      if (!value) {
        return
      }
      this._printHelp(kernel, command)
    }, {})

    kernel.flag('version', (value) => {
      if (!value) {
        return
      }

      this._dumpAsciiLogo()
      console.log(`Framework version: ${this._ignitor.application.adonisVersion?.version || 'NA'}`)
      console.log(`App version: ${this._ignitor.application.version?.version || 'NA'}`)
      console.log('')
      this._exitProcess(0)
    }, {})
  }

  /**
   * Prints help for all or a given command
   */
  private _printHelp (kernel: any, command?: any) {
    this._dumpAsciiLogo()
    kernel.printHelp(command)
    console.log('')
    this._exitProcess(0)
  }

  /**
   * Generates the manifest based upon commands defined by
   * multiple providers and the app itself.
   */
  private async _generateManifest (manifest: any, command: any) {
    try {
      /**
       * It is important to setup complete app when generating manifest, since
       * one or more commands will have imports related to AdonisJs and we
       * need to load commands for generating manifest file
       */
      await this._ignitor.bootstrap(false)

      await this._hooks.exec('before', 'manifest')
      await manifest.generate(this._ignitor.application.rcFile.commands)

      /**
       * Done
       */
      command.logger.create('ace-manifest.json')

      this._exitProcess(0)
    } catch (error) {
      await new ErrorHandler(this._ignitor.application).handleError(error)
      this._exitProcess(1)
    }
  }

  /**
   * Boostrapping the process before executing the command
   */
  private async _bootstrap (command: any) {
    if (command && command.settings && command.settings.loadApp) {
      /**
       * Bootstrap the application when command needs the app.
       */
      await this._ignitor.bootstrap(false)

      /**
       * We can make hooks only work, when the command relies on the app
       */
      await this._hooks.exec('before', 'start')
    }
  }

  /**
   * Register a before hook
   */
  public before (event: 'start', handler: () => any): this {
    this._hooks.add('before', event, handler)
    return this
  }

  /**
   * Register an after hook
   */
  public after (event: 'start', handler: () => any): this {
    this._hooks.add('after', event, handler)
    return this
  }

  /**
   * Handles a given ace command and optionally loads the
   * application when command needs it.
   */
  public async handle (argv: string[]) {
    const { Kernel, handleError, Manifest, BaseCommand } = require('@adonisjs/ace')

    const manifest = new Manifest(this._ignitor.application.appRoot)
    const kernel = new Kernel()
    kernel.useManifest(manifest)

    /**
     * Print help when no command is defined
     */
    if (!argv.length) {
      await kernel.handle() // This will load the commands from manifest
      this._printHelp(kernel)
      return
    }

    /**
     * Generate manifest when command is `generate:manifest`
     */
    if (argv[0] === 'generate:manifest') {
      class Noop extends BaseCommand {}
      await this._generateManifest(manifest, new Noop())
      return
    }

    /**
     * Hook into the before lifeycycle to boot the app before we load
     * the command file.
     */
    kernel.before('find', async (command) => {
      try {
        await this._bootstrap(command)
      } catch (error) {
        await new ErrorHandler(this._ignitor.application).handleError(error)
        this._exitProcess(1)
      }
    })

    /**
     * Execute the command and handle commands errors gracefully.
     * We must never end the process when command is executed
     * successfully, since some commands may want long
     * running processes.
     */
    try {
      this._registerGlobalFlags(kernel)
      await this._hooks.exec('after', 'start')
      await kernel.handle(argv)
    } catch (error) {
      handleError(error)
      this._exitProcess(1)
    }
  }
}
