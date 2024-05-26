/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { detectPackageManager, installPackage } from '@antfu/install-pkg'

import { CommandOptions } from '../types/ace.js'
import { args, BaseCommand, flags } from '../modules/ace/main.js'

/**
 * The install command is used to `npm install` and `node ace configure` a new package
 * in one go.
 */
export default class Add extends BaseCommand {
  static commandName = 'add'
  static description = 'Install and configure a package'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  @args.string({ description: 'Package name' })
  declare name: string

  @flags.boolean({ description: 'Display logs in verbose mode' })
  declare verbose?: boolean

  @flags.string({ description: 'Select the package manager you want to use' })
  declare packageManager?: 'npm' | 'pnpm' | 'yarn' | 'yarn@berry'

  @flags.boolean({ description: 'Should we install the package as a dev dependency', alias: 'D' })
  declare dev?: boolean

  @flags.boolean({ description: 'Forcefully overwrite existing files' })
  declare force?: boolean

  /**
   * Detect the package manager to use
   */
  async #getPackageManager() {
    const pkgManager =
      this.packageManager || (await detectPackageManager(this.app.makePath())) || 'npm'

    if (['npm', 'pnpm', 'yarn', 'yarn@berry'].includes(pkgManager)) {
      return pkgManager as 'npm' | 'pnpm' | 'yarn' | 'yarn@berry'
    }

    throw new Error('Invalid package manager. Must be one of npm, pnpm or yarn')
  }

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
   * Install the package using the selected package manager
   */
  async #installPackage(npmPackageName: string) {
    const colors = this.colors
    const spinner = this.logger
      .await(`installing ${colors.green(this.name)} using ${colors.grey(this.packageManager!)}`)
      .start()

    spinner.start()

    try {
      await installPackage(npmPackageName, {
        dev: this.dev,
        silent: this.verbose === true ? false : true,
        cwd: this.app.makePath(),
        packageManager: this.packageManager,
      })

      spinner.update('package installed successfully')
      spinner.stop()

      return true
    } catch (error) {
      spinner.update('unable to install the package')
      spinner.stop()

      this.logger.fatal(error)
      this.exitCode = 1
      return false
    }
  }

  /**
   * Run method is invoked by ace automatically
   */
  async run() {
    const colors = this.colors
    this.packageManager = await this.#getPackageManager()

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
     * Prompt the user to confirm the installation
     */
    const cmd = colors.grey(`${this.packageManager} add ${this.dev ? '-D ' : ''}${this.name}`)
    this.logger.info(`Installing the package using the following command : ${cmd}`)

    const shouldInstall = await this.prompt.confirm('Continue ?', {
      name: 'install',
      default: true,
    })

    if (!shouldInstall) {
      this.logger.info('Installation cancelled')
      return
    }

    /**
     * Install package
     */
    const pkgWasInstalled = await this.#installPackage(npmPackageName)
    if (!pkgWasInstalled) {
      return
    }

    /**
     * Configure package
     */
    const { exitCode } = await this.#configurePackage()
    this.exitCode = exitCode
    if (exitCode === 0) {
      this.logger.success(`Installed and configured ${colors.green(this.name)}`)
    } else {
      this.logger.fatal(`Unable to configure ${colors.green(this.name)}`)
    }
  }
}
