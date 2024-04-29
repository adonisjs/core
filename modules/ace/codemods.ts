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
   * Reference to lazily imported assembler code transformer
   */
  #codeTransformer?: CodeTransformer

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
   * - Lazily import the code transformer
   * - Return a fresh or reused instance of the code transformer
   */
  async #getCodeTransformer() {
    try {
      if (!this.#codeTransformer) {
        const { CodeTransformer } = await import('@adonisjs/assembler/code_transformer')
        this.#codeTransformer = new CodeTransformer(this.#app.appRoot)
      }

      return this.#codeTransformer
    } catch {
      return null
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
  async defineEnvVariables(
    environmentVariables: Record<string, number | string | boolean>,
    options?: { withEmptyExampleValue?: boolean }
  ) {
    const editor = new EnvEditor(this.#app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value, options?.withEmptyExampleValue)
    })

    await editor.save()
    this.#cliLogger.action('update .env file').succeeded()
  }

  /**
   * Returns the TsMorph project instance
   * See https://ts-morph.com/
   */
  async getTsMorphProject(): Promise<
    | InstanceType<typeof import('@adonisjs/assembler/code_transformer').CodeTransformer>['project']
    | undefined
  > {
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot create CodeTransformer. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    return transformer.project
  }

  /**
   * Define validations for the environment variables
   */
  async defineEnvValidations(validations: EnvValidationNode) {
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "start/env.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

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
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "start/kernel.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

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
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "app/policies/main.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

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
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "adonisrc.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

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
   * Register a new Vite plugin in the `vite.config.ts` file
   */
  async registerVitePlugin(...params: Parameters<CodeTransformer['addVitePlugin']>) {
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "vite.config.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const action = this.#cliLogger.action('update vite.config.ts file')
    try {
      await transformer.addVitePlugin(...params)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Register a new Japa plugin in the `tests/bootstrap.ts` file
   */
  async registerJapaPlugin(...params: Parameters<CodeTransformer['addJapaPlugin']>) {
    const transformer = await this.#getCodeTransformer()
    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot update "tests/bootstrap.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const action = this.#cliLogger.action('update tests/bootstrap.ts file')
    try {
      await transformer.addJapaPlugin(...params)
      action.succeeded()
    } catch (error) {
      this.emit('error', error)
      action.failed(error.message)
    }
  }

  /**
   * Generate the stub
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
    const transformer = await this.#getCodeTransformer()
    const appPath = this.#app.makePath()
    const colors = this.#cliLogger.getColors()
    const devDependencies = packages.filter((pkg) => pkg.isDevDependency).map(({ name }) => name)
    const dependencies = packages.filter((pkg) => !pkg.isDevDependency).map(({ name }) => name)

    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot install packages. Install "@adonisjs/assembler" or manually install following packages'
      )
      this.#cliLogger.log(`devDependencies: ${devDependencies.join(',')}`)
      this.#cliLogger.log(`dependencies: ${dependencies.join(',')}`)
      return
    }

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
    const transformer = await this.#getCodeTransformer()
    if (transformer) packageManager = await transformer.detectPackageManager(appPath)

    this.#cliLogger.log('Please install following packages')
    this.#cliLogger.log(
      this.#getInstallationCommands(devDependencies, packageManager || 'npm', true)
    )
    this.#cliLogger.log(this.#getInstallationCommands(dependencies, packageManager || 'npm', false))
  }
}
