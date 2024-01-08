/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { EventEmitter } from 'node:events'
import { EnvEditor } from '@adonisjs/env/editor'
import type { UIPrimitives } from '@adonisjs/ace/types'
import type { CodeTransformer } from '@adonisjs/assembler/code_transformer'
import type {
  MiddlewareNode,
  EnvValidationNode,
  BouncerPolicyNode,
} from '@adonisjs/assembler/types'

import type { Application } from '../app.js'

/**
 * Codemods to modify AdonisJS source files. The codemod APIs relies on
 * "@adonisjs/assembler" package and it must be installed as a dependency
 * inside user application.
 */
export class Codemods extends EventEmitter {
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
   * Reference to AdonisJS application
   */
  #app: Application<any>

  /**
   * Reference to CLI logger to write logs
   */
  #cliLogger: UIPrimitives['logger']

  /**
   * Overwrite existing files when generating files
   * from stubs
   */
  overwriteExisting = false

  /**
   * Display verbose logs for package installation
   */
  verboseInstallOutput = false

  constructor(app: Application<any>, cliLogger: UIPrimitives['logger']) {
    super()
    this.#app = app
    this.#cliLogger = cliLogger
  }

  /**
   * Lazily imports assembler
   */
  async #importAssembler() {
    if (this.#isAssemblerInstalled === undefined) {
      this.#codeTransformer = await import('@adonisjs/assembler/code_transformer')
      this.#isAssemblerInstalled = !!this.#codeTransformer
    }
  }

  /**
   * Returns the installation command for different
   * package managers
   */
  #getInstallationCommands(packages: string[], packageManager: string, isDev: boolean) {
    if (!packages.length) {
      return ''
    }

    const colors = this.#cliLogger.getColors()
    const devFlag = isDev ? ' -D' : ''

    switch (packageManager) {
      case 'yarn':
        return `${colors.yellow(`yarn add${devFlag}`)} ${packages.join(' ')}`
      case 'pnpm':
        return `${colors.yellow(`pnpm add${devFlag}`)} ${packages.join(' ')}`
      case 'npm':
      default:
        return `${colors.yellow(`npm i${devFlag}`)} ${packages.join(' ')}`
    }
  }

  /**
   * Define one or more environment variables
   */
  async defineEnvVariables(environmentVariables: Record<string, number | string | boolean>) {
    const editor = new EnvEditor(this.#app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value)
    })

    await editor.save()
    this.#cliLogger.action('update .env file').succeeded()
  }

  /**
   * Define validations for the environment variables
   */
  async defineEnvValidations(validations: EnvValidationNode) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "start/env.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update start/env.ts file')

    try {
      await transformer.defineEnvValidations(validations)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Define validations for the environment variables
   */
  async registerMiddleware(stack: 'server' | 'router' | 'named', middleware: MiddlewareNode[]) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "start/kernel.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update start/kernel.ts file')

    try {
      await transformer.addMiddlewareToStack(stack, middleware)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Register bouncer policies to the list of policies
   * collection exported from the "app/policies/main.ts"
   * file.
   */
  async registerPolicies(policies: BouncerPolicyNode[]) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "app/policies/main.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update app/policies/main.ts file')

    try {
      await transformer.addPolicies(policies)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Update RCFile
   */
  async updateRcFile(...params: Parameters<CodeTransformer['updateRcFile']>) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "adonisrc.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update adonisrc.ts file')
    try {
      await transformer.updateRcFile(...params)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Generats the stub
   */
  async makeUsingStub(stubsRoot: string, stubPath: string, stubState: Record<string, any>) {
    const stubs = await this.#app.stubs.create()
    const stub = await stubs.build(stubPath, { source: stubsRoot })
    const output = await stub.generate({ force: this.overwriteExisting, ...stubState })

    const entityFileName = slash(this.#app.relativePath(output.destination))
    const result = { ...output, relativeFileName: entityFileName }

    if (output.status === 'skipped') {
      this.#cliLogger.action(`create ${entityFileName}`).skipped(output.skipReason)
      return result
    }

    this.#cliLogger.action(`create ${entityFileName}`).succeeded()
    return result
  }

  /**
   * Install packages using the correct package manager
   * You can specify version of each package by setting it in the
   * name like :
   *
   * ```
   * this.installPackages(['@adonisjs/lucid@next', '@adonisjs/auth@3.0.0'])
   * ```
   */
  async installPackages(packages: { name: string; isDevDependency: boolean }[]) {
    await this.#importAssembler()
    const appPath = this.#app.makePath()
    const colors = this.#cliLogger.getColors()
    const devDependencies = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const dependencies = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)

    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot install packages. Install "@adonisjs/assembler" or manually install following packages'
      )
      this.#cliLogger.log(`devDependencies: ${devDependencies.join(',')}`)
      this.#cliLogger.log(`dependencies: ${dependencies.join(',')}`)
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const packageManager = await transformer.detectPackageManager(appPath)

    const spinner = this.#cliLogger.await(
      `installing dependencies using ${packageManager || 'npm'} `
    )

    const silentLogs = !this.verboseInstallOutput
    if (silentLogs) {
      spinner.start()
    }

    try {
      await transformer.installPackage(dependencies, {
        cwd: appPath,
        silent: silentLogs,
      })
      await transformer.installPackage(devDependencies, {
        dev: true,
        cwd: appPath,
        silent: silentLogs,
      })

      if (silentLogs) {
        spinner.stop()
      }

      this.#cliLogger.success('Packages installed')
      this.#cliLogger.log(
        devDependencies.map((dependency) => `    ${colors.dim('dev')} ${dependency} `).join('\n')
      )
      this.#cliLogger.log(
        dependencies.map((dependency) => `    ${colors.dim('prod')} ${dependency} `).join('\n')
      )
    } catch (error) {
      if (silentLogs) {
        spinner.update('unable to install dependencies')
        spinner.stop()
      }
      this.#cliLogger.fatal(error)
      this.emit('error', error)
    }
  }

  /**
   * List the packages one should install before using the packages
   */
  async listPackagesToInstall(packages: { name: string; isDevDependency: boolean }[]) {
    const appPath = this.#app.makePath()
    const devDependencies = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const dependencies = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)

    let packageManager: string | null = null
    if (this.#codeTransformer) {
      const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
      packageManager = await transformer.detectPackageManager(appPath)
    }

    this.#cliLogger.log('Please install following packages')
    this.#cliLogger.log(
      this.#getInstallationCommands(devDependencies, packageManager || 'npm', true)
    )
    this.#cliLogger.log(this.#getInstallationCommands(dependencies, packageManager || 'npm', false))
  }
}
