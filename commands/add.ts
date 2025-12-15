/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { prettyPrintError } from '../index.ts'
import { type CommandOptions } from '../types/ace.ts'
import { args, BaseCommand, flags } from '../modules/ace/main.ts'
import { type SupportedPackageManager } from '@adonisjs/assembler/types'

/**
 * The install command is used to `npm install` and `node ace configure` one or more packages
 * in one go.
 *
 * @example
 * ```
 * ace add @adonisjs/lucid
 * ace add @adonisjs/lucid @adonisjs/auth @adonisjs/session
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
  static description = 'Install and configure one or more packages'
  /**
   * Command options configuration
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Package names to install and configure
   */
  @args.spread({ description: 'Package names to install and configure', required: true })
  declare names: string[]

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
   * Resolve the npm package name from the user-provided name
   */
  #resolveNpmPackageName(name: string): string {
    if (name === 'vinejs') {
      return '@vinejs/vine'
    }
    if (name === 'edge') {
      return 'edge.js'
    }

    return name
  }

  /**
   * Configure the package by delegating the work to the `node ace configure` command
   */
  async #configurePackage(packageName: string) {
    const flagValueArray = this.parsed.unknownFlags
      .filter((flag) => !!this.parsed.flags[flag])
      .map((flag) => [`--${flag}`, this.parsed.flags[flag].toString()])

    const configureArgs = [
      packageName,
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
    const packages = this.names.map((name) => ({
      name,
      npmName: this.#resolveNpmPackageName(name),
    }))

    /**
     * Install all packages
     */
    const codemods = await this.createCodemods()
    codemods.verboseInstallOutput = !!this.verbose

    const packagesWereInstalled = await codemods.installPackages(
      packages.map((pkg) => ({ name: pkg.npmName, isDevDependency: !!this.dev })),
      this.packageManager
    )
    if (!packagesWereInstalled) {
      return
    }

    /**
     * Configure each package sequentially
     */
    const succeeded: string[] = []
    const failed: { name: string; error?: Error }[] = []

    for (const pkg of packages) {
      const { exitCode, error } = await this.#configurePackage(pkg.name)
      if (exitCode === 0) {
        succeeded.push(pkg.name)
      } else {
        failed.push({ name: pkg.name, error })
      }
    }

    /**
     * Report results
     */
    if (succeeded.length > 0) {
      const names = succeeded.map((name) => this.colors.green(name)).join(', ')
      this.logger.success(`Installed and configured ${names}`)
    }

    if (failed.length > 0) {
      this.exitCode = 1
      for (const pkg of failed) {
        this.logger.error(`Unable to configure ${this.colors.green(pkg.name)}`)
        if (pkg.error) {
          await prettyPrintError(pkg.error.cause || pkg.error)
        }
      }
    }
  }
}
