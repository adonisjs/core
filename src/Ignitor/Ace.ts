/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Hooks } from '@poppinss/hooks'
import { Exception } from '@poppinss/utils'

import { Ignitor } from './index'
import { ErrorHandler } from './ErrorHandler'

/**
 * Exposes the API to execute ace commands
 */
export class Ace {
  private _hooks = new Hooks()

  /**
   * A reference to application commands injected via
   * hooks, since to fetch the commands we need to
   * boot the app.
   */
  private _commands: string[] = []

  constructor (private _ignitor: Ignitor) {
  }

  /**
   * Loads the ts node with a helpful message to install ts-node
   * when it's missing as peer dependency.
   */
  private _loadTsNode () {
    try {
      return require('ts-node')
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) {
        throw new Exception('ts-node must be installed to execute ace commands')
      }
      throw error
    }
  }

  /**
   * Registers ts node with ioc transformer in place
   */
  private _registerTsNode (files: boolean) {
    /**
     * Do not register ts-node when application is not
     * loaded as part of typescript source
     */
    if (!this._ignitor.application.typescript || process.env.TS_NODE) {
      return
    }

    const { iocTransformer } = require('@adonisjs/ioc-transformer')
    const ts = require('typescript/lib/typescript')
    this._loadTsNode().register({
      files,
      transformers: {
        after: [iocTransformer(ts, this._ignitor.application.rcFile)],
      },
    })
  }

  /**
   * Registers `help` and `version` global flags
   */
  private _registerGlobalFlags (kernel: any) {
    kernel.flag('help', (value, _options, command) => {
      if (!value) {
        return
      }

      kernel.printHelp(command)
      process.exit(0)
    }, {})

    kernel.flag('version', (value) => {
      if (!value) {
        return
      }

      console.log(`Framework version: ${this._ignitor.application.adonisVersion || 'NA'}`)
      process.exit(0)
    }, {})
  }

  /**
   * Generates the manifest based upon commands defined by
   * multiple providers and the app itself.
   */
  private async _generateManifest (manifest: any, command: any) {
    /**
     * It is important to setup complete app when generating manifest, since
     * one or more commands will have imports related to AdonisJs and we
     * need to load commands for generating manifest file
     */
    this._registerTsNode(true)
    await this._ignitor.bootstrap(false)
    await this._hooks.exec('before', 'manifest')

    manifest.generate(this._commands)
    command.logger.create('ace-manifest.json')
  }

  /**
   * Boostrapping the process before executing the command
   */
  private async _bootstrap (command: any) {
    if (command && command.settings && command.settings.loadApp) {
      /**
       * When the command needs the application, then we will setup ts node
       * to include all the files mentioned in `tsconfig.json` and then
       * boostrap the app
       */
      this._registerTsNode(true)
      await this._ignitor.bootstrap(false)

      /**
       * We can make hooks only work, when the command relies on the app
       */
      await this._hooks.exec('before', 'start')
    } else {
      /**
       * Otherwise, we still register ts-node, since the command user maybe using
       * typescript files but, we let ts-node to discover the imports and then
       * compile them on fly.
       *
       * In short, this method doesn't allow AdonisJs `@ioc` style imports
       * to work
       */
      this._registerTsNode(false)
    }
  }

  /**
   * Register a before hook
   */
  public before (event: 'start' | 'manifest', handler: () => any): this {
    this._hooks.add('before', event, handler)
    return this
  }

  /**
   * Register an after hook
   */
  public after (event: 'start' | 'close', handler: () => any): this {
    this._hooks.add('after', event, handler)
    return this
  }

  /**
   * Inject commands for which to generate the manifest file
   */
  public injectCommands (commands: string[]) {
    this._commands = commands
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
    this._registerGlobalFlags(kernel)

    /**
     * Print help when no command is defined
     */
    if (!argv.length) {
      await kernel.handle() // This will load the commands from manifest
      kernel.printHelp()
      process.exit(0)
    }

    /**
     * Generate manifest when command is `generate:manifest`
     */
    if (argv[0] === 'generate:manifest') {
      try {
        class Noop extends BaseCommand {}
        await this._generateManifest(manifest, new Noop())
      } catch (error) {
        await new ErrorHandler(this._ignitor.application).handleError(error)
        process.exit(1)
      }

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
        process.exit(1)
      }
    })

    /**
     * Execute the command and handle commands errors gracefully.
     * We must never end the process when command is executed
     * successfully, since some commands may want long
     * running processes.
     */
    try {
      await this._hooks.exec('after', 'start')
      await kernel.handle(argv)
    } catch (error) {
      handleError(error)
      process.exit(1)
    }
  }
}
