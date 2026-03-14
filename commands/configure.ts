/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@poppinss/utils/exception'

import { stubsRoot } from '../stubs/main.ts'
import type { CommandOptions } from '../types/ace.ts'
import { args, BaseCommand, flags } from '../modules/ace/main.ts'

/**
 * Command to configure packages after installation by running their configuration hooks.
 * Supports built-in configurations for VineJS, Edge, and health checks, or can execute
 * custom configure functions exported by packages.
 *
 * @example
 * ```
 * ace configure @adonisjs/lucid
 * ace configure vinejs
 * ace configure edge
 * ace configure health_checks
 * ace configure @adonisjs/auth --force --verbose
 * ```
 */
export default class Configure extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'configure'

  /**
   * The command description
   */
  static description =
    'Run the configure hook of an already-installed package. Use "add" command instead to both install and configure in one step'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed to package configure functions.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Expose all flags from the protected property "parsed" for access by package configure functions
   */
  get parsedFlags() {
    return this.parsed.flags
  }

  /**
   * Expose all arguments from the protected property "parsed" for access by package configure functions
   */
  get parsedArgs() {
    return this.parsed._
  }

  /**
   * Name of the package to configure
   */
  @args.string({ description: 'Package name' })
  declare name: string

  /**
   * Enable verbose logging during package installation and configuration
   */
  @flags.boolean({ description: 'Display logs in verbose mode', alias: 'v' })
  declare verbose?: boolean

  /**
   * Forcefully overwrite existing files during configuration
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files', alias: 'f' })
  declare force?: boolean

  /**
   * The root directory path of the package's stubs.
   * Set automatically when the package exports a stubsRoot property.
   */
  declare stubsRoot: string

  /**
   * Import and return the main exports of a package.
   * Returns null if the package is not found, rethrows other errors.
   *
   * @param packageName - The name of the package to import
   * @returns The package exports or null if not found
   */
  async #getPackageSource(packageName: string) {
    try {
      const packageExports = await this.app.import(packageName)
      return packageExports
    } catch (error) {
      if (
        (error.code && error.code === 'ERR_MODULE_NOT_FOUND') ||
        error.message.startsWith('Cannot find module')
      ) {
        return null
      }
      throw error
    }
  }

  /**
   * Configure VineJS validation library by registering its provider in the RC file
   */
  async #configureVineJS() {
    const codemods = await this.createCodemods()
    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/vinejs_provider')
    })
  }

  /**
   * Configure Edge template engine by registering its provider and adding view meta files
   */
  async #configureEdge() {
    const codemods = await this.createCodemods()
    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/edge_provider')
      rcFile.addMetaFile('resources/views/**/*.edge', false)
    })
  }

  /**
   * Configure health checks feature by generating the main health file and controller
   */
  async #configureHealthChecks() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'make/health/main.stub', {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity('health'),
    })
    await codemods.makeUsingStub(stubsRoot, 'make/health/controller.stub', {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity('health_checks'),
    })
  }

  /**
   * Create a codemods instance configured with command options.
   * Sets overwrite and verbose flags based on command arguments.
   */
  async createCodemods() {
    const codemods = await super.createCodemods()
    codemods.overwriteExisting = this.force === true
    codemods.verboseInstallOutput = this.verbose === true
    return codemods
  }

  /**
   * Execute the configure command. Handles built-in configurations for VineJS, Edge,
   * and health checks, or imports and executes the configure function from the specified package.
   */
  async run() {
    if (this.name === 'vinejs') {
      return this.#configureVineJS()
    }
    if (this.name === 'edge') {
      return this.#configureEdge()
    }
    if (this.name === 'health_checks') {
      return this.#configureHealthChecks()
    }

    const packageExports = await this.#getPackageSource(this.name)
    if (!packageExports) {
      this.logger.error(`Cannot find module "${this.name}". Make sure to install it`)
      this.exitCode = 1
      return
    }

    /**
     * Warn, there are not instructions to run
     */
    if (!packageExports.configure) {
      this.logger.warning(
        `Cannot configure module "${this.name}". The module does not export the configure hook`
      )
      return
    }

    /**
     * Set stubsRoot property when package exports it
     */
    if (packageExports.stubsRoot) {
      this.stubsRoot = packageExports.stubsRoot
    }

    /**
     * Run instructions
     */
    try {
      await packageExports.configure(this)
    } catch (error) {
      throw new RuntimeException(`Unable to configure package "${this.name}"`, {
        cause: error,
      })
    }
  }
}
