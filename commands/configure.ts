/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { installPackage, detectPackageManager } from '@antfu/install-pkg'

import { EnvEditor } from '../modules/env.js'
import type { ApplicationService } from '../src/types.js'
import { args, BaseCommand } from '../modules/ace/main.js'

/**
 * The configure command is used to configure packages after installation
 */
export default class Configure extends BaseCommand {
  static commandName = 'configure'
  static description = 'Configure a package post installation'

  @args.string({ description: 'Package name' })
  declare name: string

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
   * Publish a stub file to the user project
   */
  async publishStub(stubPath: string, stubData?: Record<string, any>) {
    const stub = await this.app.stubs.build(stubPath, {
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
    const logs: string[] = []
    const editor = new EnvEditor(this.app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value)
      logs.push(`               ${this.colors.dim(`${key}=${value}`)}`)
    })

    await editor.save()
    this.logger.action('update .env file').succeeded()
    this.logger.log(logs.join('\n'))
  }

  /**
   * Update rcFile
   */
  async updateRcFile(
    callback: (rcFileEditor: ApplicationService['rcFileEditor']) => Promise<void> | void
  ) {
    await callback(this.app.rcFileEditor)
    await this.app.rcFileEditor.save()
    this.logger.action('update .adonisrc.json file').succeeded()
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

    const devDeps = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const deps = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)

    const packageManager = await detectPackageManager(appPath)
    let spinner = this.logger
      .await(`installing dependencies using ${packageManager || 'npm'}`)
      .start()

    try {
      await installPackage(deps, { cwd: appPath, silent: true })
      await installPackage(devDeps, { dev: true, cwd: appPath, silent: true })

      spinner.stop()
      this.logger.success('dependencies installed')
      this.logger.log(devDeps.map((dep) => `      ${this.colors.dim('dev')} ${dep}`).join('\n'))
      this.logger.log(deps.map((dep) => `      ${this.colors.dim('prod')} ${dep}`).join('\n'))
    } catch (error) {
      spinner.update('unable to install dependencies')
      spinner.stop()
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
