/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type CommandOptions } from '../types/ace.ts'
import { args, BaseCommand, flags } from '../modules/ace/main.ts'
import { type SupportedPackageManager } from '@adonisjs/assembler/types'

/**
 * The install command is used to `npm install` and `node ace configure` a new package
 * in one go.
 *
 * @example
 * ```
 * ace add @adonisjs/lucid
 * ace add @adonisjs/session --dev
 * ace add vinejs --force
 * ace add edge --package-manager=pnpm
 * ```
 */
export default class Add extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'add'
  /**
   * The command description
   */
  static description = 'Install and configure a package'
  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Package name to install and configure
   */
  @args.string({ description: 'Package name' })
  declare name: string

  /**
   * Display logs in verbose mode
   */
  @flags.boolean({ description: 'Display logs in verbose mode' })
  declare verbose?: boolean

  /**
   * Define the package manager you want to use
   */
  @flags.string({ description: 'Define the package manager you want to use' })
  declare packageManager?: SupportedPackageManager

  /**
   * Should we install the package as a dev dependency
   */
  @flags.boolean({ description: 'Should we install the package as a dev dependency', alias: 'D' })
  declare dev?: boolean

  /**
   * Forcefully overwrite existing files
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files' })
  declare force?: boolean

  /**
   * Configure the package by delegating the work to the `node ace configure` command
   */
  async #configurePackage() {
    /**
     * Sending unknown flags to the configure command
     */
    const flagValueArray = this.parsed.unknownFlags
      .filter((flag) => !!this.parsed.flags[flag])
      .map((flag) => [`--${flag}`, this.parsed.flags[flag].toString()])

    const configureArgs = [
      this.name,
      this.force ? '--force' : undefined,
      this.verbose ? '--verbose' : undefined,
      ...flagValueArray.flat(),
    ].filter(Boolean) as string[]

    return await this.kernel.exec('configure', configureArgs)
  }

  /**
   * Run method is invoked by ace automatically
   */
  async run() {
    /**
     * Handle special packages to configure
     */
    let npmPackageName = this.name
    if (this.name === 'vinejs') {
      npmPackageName = '@vinejs/vine'
    } else if (this.name === 'edge') {
      npmPackageName = 'edge.js'
    }

    /**
     * Install package
     */
    const codemods = await this.createCodemods()
    codemods.verboseInstallOutput = !!this.verbose
    const pkgWasInstalled = await codemods.installPackages(
      [{ name: npmPackageName, isDevDependency: !!this.dev }],
      this.packageManager
    )
    if (!pkgWasInstalled) {
      return
    }

    /**
     * Configure package
     */
    const { exitCode } = await this.#configurePackage()
    this.exitCode = exitCode
    if (exitCode === 0) {
      this.logger.success(`Installed and configured ${this.colors.green(this.name)}`)
    } else {
      this.logger.fatal(`Unable to configure ${this.colors.green(this.name)}`)
    }
  }
}
