/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { detectPackageManager, installPackage } from '@antfu/install-pkg'

import { type CommandOptions } from '../types/ace.js'
import { args, BaseCommand, flags } from '../modules/ace/main.js'

const KNOWN_PACKAGE_MANAGERS = ['npm', 'pnpm', 'bun', 'yarn', 'yarn@berry', 'pnpm@6'] as const

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
  declare packageManager?: (typeof KNOWN_PACKAGE_MANAGERS)[number]

  @flags.boolean({ description: 'Should we install the package as a dev dependency', alias: 'D' })
  declare dev?: boolean

  @flags.boolean({ description: 'Forcefully overwrite existing files' })
  declare force?: boolean

  /**
   * Extract the bare package name and version from a user-supplied
   * package string. Scoped packages like "@adonisjs/auth@1.0.0"
   * need special handling since the first "@" is part of the scope.
   */
  #extractPackageNameAndVersion(pkg: string): { name: string; version?: string } {
    if (pkg.startsWith('@')) {
      const secondAtIndex = pkg.indexOf('@', 1)
      if (secondAtIndex === -1) {
        return { name: pkg }
      }
      return { name: pkg.substring(0, secondAtIndex), version: pkg.substring(secondAtIndex + 1) }
    }

    const atIndex = pkg.indexOf('@')
    if (atIndex === -1) {
      return { name: pkg }
    }
    return { name: pkg.substring(0, atIndex), version: pkg.substring(atIndex + 1) }
  }

  #getPackageVersion(packageName: string) {
    return {
      '@adonisjs/inertia': '^3.1.1',
      '@adonisjs/session': '^7.7.1',
      '@adonisjs/transmit': '^2.0.2',
      '@adonisjs/cache': '^1.3.1',
      '@adonisjs/otel': '^1.2.0',
      '@adonisjs/lock': '^1.1.1',
      '@adonisjs/cors': '^2.2.1',
      '@adonisjs/bouncer': '^3.1.6',
      '@adonisjs/shield': '^8.2.0',
      '@adonisjs/drive': '^3.4.1',
      '@adonisjs/auth': '^9.6.0',
      '@adonisjs/vite': '^4.0.0',
      '@adonisjs/redis': '^9.2.0',
      '@adonisjs/i18n': '^2.2.3',
      '@adonisjs/ally': '^5.1.1',
      '@adonisjs/limiter': '^2.4.0',
      '@adonisjs/static': '^1.1.1',
      '@adonisjs/lucid-slugify': '^3.0.0',
    }[packageName]
  }

  /**
   * Detect the package manager to use
   */
  async #getPackageManager() {
    const packageManager =
      this.packageManager || (await detectPackageManager(this.app.makePath())) || 'npm'

    if (
      KNOWN_PACKAGE_MANAGERS.some((knownPackageManager) => knownPackageManager === packageManager)
    ) {
      return packageManager as (typeof KNOWN_PACKAGE_MANAGERS)[number] | undefined
    }

    throw new Error('Invalid package manager. Must be one of npm, pnpm, bun or yarn')
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
    const { name, version } = this.#extractPackageNameAndVersion(npmPackageName)
    const knownVersion = this.#getPackageVersion(name)
    if (knownVersion) {
      npmPackageName = `${name}@${knownVersion}`
    } else if (version) {
      npmPackageName = `${name}@${version}`
    }

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
