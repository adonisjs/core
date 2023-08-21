/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { EnvEditor } from '@adonisjs/env/editor'
import type { AddMiddlewareEntry, EnvValidationDefinition } from '@adonisjs/assembler/types'
import { installPackage, detectPackageManager } from '@antfu/install-pkg'
import type { CodeTransformer } from '@adonisjs/assembler/code_transformer'

import { args, BaseCommand, flags } from '../modules/ace/main.js'

/**
 * The configure command is used to configure packages after installation
 */
export default class Configure extends BaseCommand {
  static commandName = 'configure'
  static description = 'Configure a package post installation'

  @args.string({ description: 'Package name' })
  declare name: string

  @flags.boolean({ description: 'Display logs in verbose mode' })
  declare verbose?: boolean

  /**
   * The root of the stubs directory. The value is defined after we import
   * the package
   */
  declare stubsRoot: string

  /**
   * Flag to know if assembler is installed as a
   * peer dependency or not.
   */
  #isAssemblerInstalled?: boolean

  /**
   * Reference to lazily imported assembler code transformer
   */
  #codeTransformer?: typeof import('@adonisjs/assembler/code_transformer')

  /**
   * Returns the package main exports
   */
  #getPackageSource(packageName: string) {
    return this.app.import(packageName)
  }

  /**
   * Returns the installation command for different
   * package managers
   */
  #getInstallationCommands(
    packages: string[],
    packageManager: 'npm' | 'pnpm' | 'yarn',
    isDev: boolean
  ) {
    if (!packages.length) {
      return ''
    }

    const devFlag = isDev ? ' -D' : ''

    switch (packageManager) {
      case 'npm':
        return `${this.colors.yellow(`npm i${devFlag}`)} ${packages.join(' ')}`
      case 'yarn':
        return `${this.colors.yellow(`yarn add${devFlag}`)} ${packages.join(' ')}`
      case 'pnpm':
        return `${this.colors.yellow(`pnpm add${devFlag}`)} ${packages.join(' ')}`
    }
  }

  /**
   * Lazily installs assembler
   */
  async #installAssembler() {
    if (this.#isAssemblerInstalled === undefined) {
      this.#codeTransformer = await import('@adonisjs/assembler/code_transformer')
      this.#isAssemblerInstalled = !!this.#codeTransformer
    }
  }

  /**
   * Registers VineJS provider
   */
  async #configureVineJS() {
    await this.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/vinejs_provider')
    })
  }

  /**
   * Registers Edge provider
   */
  async #configureEdge() {
    await this.updateRcFile((rcFile) => {
      rcFile.addProvider('@adonisjs/core/providers/edge_provider')
    })
  }

  /**
   * Publish a stub file to the user project
   */
  async publishStub(stubPath: string, stubData?: Record<string, any>) {
    const stubs = await this.app.stubs.create()
    const stub = await stubs.build(stubPath, {
      source: this.stubsRoot,
    })

    const output = await stub.generate(stubData || {})

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
   * Define one or more environment variables
   */
  async defineEnvVariables(environmentVariables: Record<string, number | string | boolean>) {
    const editor = new EnvEditor(this.app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value)
    })

    await editor.save()
    this.logger.action('update .env file').succeeded()
  }

  /**
   * Define validations for the environment variables
   */
  async defineEnvValidations(validations: EnvValidationDefinition) {
    await this.#installAssembler()
    if (!this.#codeTransformer) {
      this.logger.warning(
        'Cannot update "start/env.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.app.appRoot)
    const action = this.logger.action('update start/env.ts file')
    try {
      await transformer.defineEnvValidations(validations)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Define validations for the environment variables
   */
  async registerMiddleware(stack: 'server' | 'router' | 'named', middleware: AddMiddlewareEntry[]) {
    await this.#installAssembler()
    if (!this.#codeTransformer) {
      this.logger.warning(
        'Cannot update "start/kernel.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.app.appRoot)
    const action = this.logger.action('update start/kernel.ts file')

    try {
      await transformer.addMiddlewareToStack(stack, middleware)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Update rcFile
   */
  async updateRcFile(...params: Parameters<CodeTransformer['updateRcFile']>) {
    await this.#installAssembler()
    if (!this.#codeTransformer) {
      this.logger.warning(
        'Cannot update "adonisrc.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const action = this.logger.action('update adonisrc.ts file')
    try {
      await new this.#codeTransformer.CodeTransformer(this.app.appRoot).updateRcFile(...params)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Install packages using the correct package manager
   * You can specify version of each package by setting it in the
   * name like :
   *
   * ```
   * installPackages(['@adonisjs/lucid@next', '@adonisjs/auth@3.0.0'])
   * ```
   */
  async installPackages(packages: { name: string; isDevDependency: boolean }[]) {
    const appPath = this.app.makePath()
    const silent = this.verbose === true ? false : true

    const devDeps = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const deps = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)
    const packageManager = await detectPackageManager(appPath)

    let spinner = this.logger
      .await(`installing dependencies using ${packageManager || 'npm'}`)
      .start()

    try {
      await installPackage(deps, { cwd: appPath, silent })
      await installPackage(devDeps, { dev: true, cwd: appPath, silent })

      spinner.stop()
      this.logger.success('dependencies installed')
      this.logger.log(devDeps.map((dep) => `      ${this.colors.dim('dev')} ${dep}`).join('\n'))
      this.logger.log(deps.map((dep) => `      ${this.colors.dim('prod')} ${dep}`).join('\n'))
    } catch (error) {
      spinner.update('unable to install dependencies')
      spinner.stop()
      this.exitCode = 1
      this.logger.fatal(error)
    }
  }

  /**
   * List the packages one should install before using the packages
   */
  listPackagesToInstall(packages: { name: string; isDevDependency: boolean }[]) {
    const devDependencies = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const prodDependencies = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)
    const instructions = this.ui.sticker().heading('Please install following packages')

    ;[
      this.colors.dim('# npm'),
      this.#getInstallationCommands(devDependencies, 'npm', true),
      this.#getInstallationCommands(prodDependencies, 'npm', false),
      ' ',
    ]
      .concat([
        this.colors.dim('# yarn'),
        this.#getInstallationCommands(devDependencies, 'yarn', true),
        this.#getInstallationCommands(prodDependencies, 'yarn', false),
        ' ',
      ])
      .concat([
        this.colors.dim('# pnpm'),
        this.#getInstallationCommands(devDependencies, 'pnpm', true),
        this.#getInstallationCommands(prodDependencies, 'pnpm', false),
      ])
      .filter((line) => line.length)
      .forEach((line) => instructions.add(line))

    instructions.render()
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
     * Instructions needs stubs root
     */
    if (!packageExports.stubsRoot) {
      this.logger.error(
        `Missing "stubsRoot" export from "${this.name}" package. The stubsRoot variable is required to lookup package stubs`
      )
      this.exitCode = 1
      return
    }

    this.stubsRoot = packageExports.stubsRoot

    /**
     * Run instructions
     */
    await packageExports.configure(this)
  }
}
