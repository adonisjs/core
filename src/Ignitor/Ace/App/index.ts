/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel } from '@adonisjs/ace'
import { sticker, logger } from '@poppinss/cliui'
import { resolveFrom } from '@poppinss/utils/build/helpers'
import { SerializedCommand } from '@adonisjs/ace/build/src/Contracts'

import { AppKernel } from '../../Kernel'
import { loadAceCommands } from '../../../utils'
import { GenerateManifest } from '../GenerateManifest'

/**
 * A local list of assembler commands. We need this, so that when assembler
 * is not installed (probably in production) and someone is trying to
 * build the project by running `serve` or `build`, we should give
 * them a better descriptive error.
 *
 * Also, do note that at times this list will be stale, but we get it back
 * in sync over time.
 */
const ASSEMBLER_COMMANDS = [
  'build',
  'serve',
  'invoke',
  'make:command',
  'make:controller',
  'make:exception',
  'make:listener',
  'make:middleware',
  'make:prldfile',
  'make:provider',
  'make:validator',
  'make:view',
]

/**
 * Exposes the API to execute app commands registered under
 * the manifest file.
 */
export class App {
  private commandName: string

  /**
   * Returns a boolean if mentioned command is an assembler
   * command
   */
  private get isAssemblerCommand() {
    return ASSEMBLER_COMMANDS.includes(this.commandName)
  }

  /**
   * Reference to the app kernel
   */
  private kernel = new AppKernel(this.appRoot, 'console')

  /**
   * Reference to the ace kernel
   */
  private ace = new Kernel(this.kernel.application)

  /**
   * Source root always points to the compiled source
   * code.
   */
  constructor(private appRoot: string) {}

  /**
   * Print commands help
   */
  private printHelp(value?: any, command?: any) {
    if (!value) {
      return
    }

    this.ace.printHelp(command, [GenerateManifest.getManifestJSON()])
    process.exit(0)
  }

  /**
   * Print framework version
   */
  private printVersion(value?: any) {
    if (!value) {
      return
    }

    const appVersion = this.kernel.application.version
    const adonisVersion = this.kernel.application.adonisVersion

    let assemblerVersion = 'Not Installed'
    try {
      assemblerVersion = require(resolveFrom(
        this.appRoot,
        '@adonisjs/assembler/package.json'
      )).version
    } catch (error) {}

    sticker()
      .heading('node ace --version')
      .add(`App version: ${logger.colors.cyan(appVersion ? appVersion.version : 'NA')}`)
      .add(`Framework version: ${logger.colors.cyan(adonisVersion ? adonisVersion.version : 'NA')}`)
      .add(`Assembler version: ${logger.colors.cyan(assemblerVersion)}`)
      .render()

    process.exit(0)
  }

  /**
   * Invoked before command source will be read from the
   * disk
   */
  private async onFind(command: SerializedCommand | null) {
    if (!command) {
      return
    }

    /**
     * Register ts hook when
     *
     * - Haven't registered it already
     * - Is a typescript project
     * - Is not an assembler command
     */
    if (!this.isAssemblerCommand) {
      this.kernel.registerTsCompilerHook()
    }

    /**
     * Only main command can load the application or switch
     * the environment.
     *
     * If a sub-command needs application, then the main command
     * should set "loadApp" to true as well.
     */
    if (command.commandName === this.commandName) {
      /**
       * Switch environment before wiring the app
       */
      if (command.settings.environment) {
        this.kernel.application.switchEnvironment(command.settings.environment)
      }

      if (command.settings.loadApp) {
        /**
         * Set ace instance within the container, so that the underlying
         * commands or the app can access it from the container
         */
        this.kernel.application.container.singleton('Adonis/Core/Ace', () => this.ace)
        await this.kernel.boot()
      }
    }
  }

  /**
   * Invoked before command is about to run.
   */
  private async onRun() {
    if (this.kernel.hasBooted) {
      await this.kernel.start()
    }
  }

  /**
   * Hooks into ace lifecycle events to conditionally
   * load the app.
   */
  private registerAceHooks() {
    this.ace.before('find', async (command) => this.onFind(command))
    this.ace.before('run', async () => this.onRun())
  }

  /**
   * Adding flags
   */
  private registerAceFlags() {
    /**
     * Showing help including core commands
     */
    this.ace.flag('help', async (value, _, command) => this.printHelp(value, command), {
      alias: 'h',
    })

    /**
     * Showing app and AdonisJs version
     */
    this.ace.flag('version', async (value) => this.printVersion(value), { alias: 'v' })
  }

  /**
   * Load commands using manifest loader
   */
  public async loadCommands() {
    await loadAceCommands(this.kernel.application, this.ace)
  }

  /**
   * Handle application command
   */
  public async handle(argv: string[]) {
    try {
      /**
       * Manifest files to load
       */
      await this.loadCommands()

      /**
       * Define ace hooks to wire the application (if required)
       */
      this.registerAceHooks()

      /**
       * Define global flags
       */
      this.registerAceFlags()

      /**
       * Print help when no arguments have been passed
       */
      if (!argv.length) {
        this.printHelp(true)
        return
      }

      /**
       * Hold reference to the command name. We will use this to decide whether
       * or not to exit the process forcefully after the command has been
       * executed
       */
      this.commandName = argv[0]

      /**
       * Listen for the exit signal on ace kernel
       */
      this.ace.onExit(async () => {
        if (!this.ace.error) {
          process.exit(this.ace.exitCode)
        }

        return this.kernel
          .handleError(this.ace.error)
          .finally(() => process.exit(this.ace.exitCode))
      })

      /**
       * Handle command
       */
      await this.ace.handle(argv)
    } catch (error) {
      if (!error) {
        process.exit(1)
      }
      this.kernel.handleError(error).finally(() => process.exit(1))
    }
  }
}
