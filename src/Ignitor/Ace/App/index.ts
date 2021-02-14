/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { sticker, logger } from '@poppinss/cliui'
import { Application } from '@adonisjs/application'
import { Kernel, ManifestLoader } from '@adonisjs/ace'
import { resolveFrom } from '@poppinss/utils/build/helpers'

import { ErrorHandler } from '../ErrorHandler'
import { registerTsHook } from '../../../utils'
import { SignalsListener } from '../../SignalsListener'

import { SerializedCommand } from '@adonisjs/ace/build/src/Contracts'

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
   * Whether or not the app was wired. App is only wired, when
   * loadApp inside the command setting is true.
   */
  private wired = false

  /**
   * Reference to the application
   */
  private application = new Application(this.appRoot, 'console')

  /**
   * Reference to the ace kernel
   */
  private kernel = new Kernel(this.application)

  /**
   * Signals listener to listen for exit signals and kill command
   */
  private signalsListener = new SignalsListener(this.application)

  /**
   * Find if TS hook has been registered or not
   */
  private registeredTsHook: boolean = false

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

    this.kernel.printHelp(command)
    process.exit(0)
  }

  /**
   * Print framework version
   */
  private printVersion(value?: any) {
    if (!value) {
      return
    }

    const appVersion = this.application.version
    const adonisVersion = this.application.adonisVersion

    let assemblerVersion = 'Not Installed'
    try {
      assemblerVersion = require(resolveFrom(this.appRoot, '@adonisjs/assembler/package.json'))
        .version
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
    if (!this.registeredTsHook && this.application.rcFile.typescript && !this.isAssemblerCommand) {
      registerTsHook(this.application.appRoot)
      this.registeredTsHook = true
    }

    /**
     * Wire application if not wired and "loadApp" is true
     */
    if (!this.wired && command.settings.loadApp) {
      /**
       * Switch environment before wiring the app
       */
      if (command.settings.environment) {
        this.application.switchEnvironment(command.settings.environment)
      }
      await this.wire()
    }
  }

  /**
   * Invoked before command is about to run.
   */
  private async onRun() {
    if (this.wired) {
      await this.application.start()
    }
  }

  /**
   * Hooks into kernel lifecycle events to conditionally
   * load the app.
   */
  private addKernelHooks() {
    this.kernel.before('find', async (command) => this.onFind(command))
    this.kernel.before('run', async () => this.onRun())
  }

  /**
   * Adding flags
   */
  private addKernelFlags() {
    /**
     * Showing help including core commands
     */
    this.kernel.flag('help', async (value, _, command) => this.printHelp(value, command), {
      alias: 'h',
    })

    /**
     * Showing app and AdonisJs version
     */
    this.kernel.flag('version', async (value) => this.printVersion(value), { alias: 'v' })
  }

  /**
   * Boot the application.
   */
  private async wire() {
    if (this.wired) {
      return
    }

    this.wired = true

    /**
     * Do not change sequence
     */
    await this.application.setup()
    await this.application.registerProviders()
    await this.application.bootProviders()
    await this.application.requirePreloads()
  }

  /**
   * Returns manifest details for assembler
   */
  private getAssemblerManifest() {
    try {
      const manifestAbsPath = resolveFrom(
        this.application.appRoot,
        '@adonisjs/assembler/build/ace-manifest.json'
      )
      const basePath = join(manifestAbsPath, '../')
      return [
        {
          manifestAbsPath,
          basePath,
        },
      ]
    } catch (error) {
      return []
    }
  }

  /**
   * Returns manifest details for app
   */
  private getAppManifest() {
    try {
      const manifestAbsPath = resolveFrom(this.application.appRoot, './ace-manifest.json')
      const basePath = this.application.appRoot
      return [
        {
          manifestAbsPath,
          basePath,
        },
      ]
    } catch (error) {
      return []
    }
  }

  /**
   * Handle application command
   */
  public async handle(argv: string[]) {
    try {
      /**
       * Manifest files to load
       */
      this.kernel.useManifest(
        new ManifestLoader(this.getAssemblerManifest().concat(this.getAppManifest()))
      )

      /**
       * Define kernel hooks to wire the application (if required)
       */
      this.addKernelHooks()

      /**
       * Define global flags
       */
      this.addKernelFlags()

      /**
       * Preload manifest in advance. This way we can show the help
       * when no args are defined
       */
      await this.kernel.preloadManifest()

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
       * Listen for exit events and shutdown app
       */
      this.signalsListener.listen(async () => {
        if (this.wired) {
          await this.application.shutdown()
        }
      })

      /**
       * Listen for the exit signal on ace kernel
       */
      this.kernel.onExit(async () => {
        if (this.kernel.error) {
          await new ErrorHandler(this.application).handleError(this.kernel.error)
        }

        process.exit(this.kernel.exitCode)
      })

      /**
       * Handle command
       */
      await this.kernel.handle(argv)
    } catch (error) {
      if (!error) {
        process.exit(1)
        return
      }
      new ErrorHandler(this.application).handleError(error).finally(() => process.exit(1))
    }
  }
}
