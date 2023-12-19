/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import type { CommandOptions } from '../types/ace.js'
import { args, BaseCommand, flags } from '../modules/ace/main.js'

/**
 * The configure command is used to configure packages after installation
 */
export default class Configure extends BaseCommand {
  static commandName = 'configure'
  static description = 'Configure a package post installation'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Exposing all flags from the protected property "parsed"
   */
  get parsedFlags() {
    return this.parsed.flags
  }

  /**
   * Exposing all args from the protected property "parsed"
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
   * Turn on verbose mode for packages installation
   */
  @flags.boolean({ description: 'Display logs in verbose mode' })
  declare verbose?: boolean

  /**
   * Forcefully overwrite existing files.
   */
  @flags.boolean({ description: 'Forcefully overwrite existing files' })
  declare force?: boolean

  /**
   * The root of the stubs directory. The value is defined after we import
   * the package
   */
  declare stubsRoot: string

  /**
   * Returns the package main exports
   */
  #getPackageSource(packageName: string) {
    return this.app.import(packageName)
  }

  /**
   * Registers VineJS provider
   */
  async #configureVineJS() {
    const codemods = await this.createCodemods()
    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/vinejs_provider')
    })
  }

  /**
   * Registers Edge provider
   */
  async #configureEdge() {
    const codemods = await this.createCodemods()
    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/edge_provider')
      rcFile.addMetaFile('resources/views/**/*.edge', false)
    })
  }

  /**
   * Creates codemods as per configure command options
   */
  async createCodemods() {
    const codemods = await super.createCodemods()
    codemods.overwriteExisting = this.force === true
    codemods.verboseInstallOutput = this.verbose === true
    return codemods
  }

  /**
   * Publish a stub file to the user project
   */
  async publishStub(stubPath: string, stubData?: Record<string, any>) {
    const stubs = await this.app.stubs.create()
    const stub = await stubs.build(stubPath, {
      source: this.stubsRoot,
    })

    const output = await stub.generate(
      Object.assign(
        {
          force: this.force,
        },
        stubData
      )
    )

    /**
     * Log message
     */
    const entityFileName = slash(this.app.relativePath(output.destination))
    if (output.status === 'skipped') {
      return this.logger.action(`create ${entityFileName}`).skipped(output.skipReason)
    }

    this.logger.action(`create ${entityFileName}`).succeeded()
  }

  /**
   * Run method is invoked by ace automatically
   */
  async run() {
    if (this.name === 'vinejs') {
      return this.#configureVineJS()
    }
    if (this.name === 'edge') {
      return this.#configureEdge()
    }

    const packageExports = await this.#getPackageSource(this.name)

    /**
     * Warn, there are not instructions to run
     */
    if (!packageExports.configure) {
      this.logger.warning(
        `Cannot configure "${this.name}" package. The package does not export the configure hook`
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
    await packageExports.configure(this)
  }
}
