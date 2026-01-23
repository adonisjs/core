/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { isAbsolute } from 'node:path'
import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import { EnvEditor } from '@adonisjs/env/editor'
import type { UIPrimitives } from '@adonisjs/ace/types'
import type { CodeTransformer } from '@adonisjs/assembler/code_transformer'
import type {
  MiddlewareNode,
  EnvValidationNode,
  BouncerPolicyNode,
  SupportedPackageManager,
} from '@adonisjs/assembler/types'

import debug from '../../src/debug.ts'
import type { Application } from '../app.ts'
import stringHelpers from '../../src/helpers/string.ts'
import { type GeneratedStub } from '../../types/app.ts'

/**
 * Codemods class for programmatically modifying AdonisJS source files.
 * This class provides APIs to modify configuration files, register middleware,
 * generate stubs, and install packages.
 *
 * The codemod APIs rely on the "@adonisjs/assembler" package, which must be
 * installed as a dependency in the user application.
 *
 * @example
 * ```ts
 * const codemods = new Codemods(app, logger)
 *
 * // Generate a controller from a stub
 * await codemods.makeUsingStub(stubsRoot, 'controller.stub', {
 *   filename: 'UserController',
 *   entity: { name: 'User' }
 * })
 *
 * // Install packages
 * await codemods.installPackages([
 *   { name: '@adonisjs/lucid', isDevDependency: false }
 * ])
 * ```
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
      case 'yarn@berry':
        return `${colors.yellow(`yarn add${devFlag}`)} ${packages.join(' ')}`
      case 'pnpm':
        return `${colors.yellow(`pnpm add${devFlag}`)} ${packages.join(' ')}`
      case 'npm':
      default:
        return `${colors.yellow(`npm i${devFlag}`)} ${packages.join(' ')}`
    }
  }

  /**
   * Define one or more environment variables in the .env file
   *
   * @param environmentVariables - Key-value pairs of environment variables
   * @param options - Configuration options
   * @param options.omitFromExample - Keys to exclude from .env.example file
   *
   * @example
   * ```ts
   * await codemods.defineEnvVariables({
   *   DB_CONNECTION: 'mysql',
   *   DB_HOST: 'localhost',
   *   SECRET_KEY: 'abc123'
   * }, {
   *   omitFromExample: ['SECRET_KEY']
   * })
   * ```
   */
  async defineEnvVariables<T extends Record<string, number | string | boolean>>(
    environmentVariables: T,
    options?: { omitFromExample?: Array<keyof T> }
  ) {
    const editor = new EnvEditor(this.#app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value, options?.omitFromExample?.includes(key))
    })

    await editor.save()
    this.#cliLogger.action('update .env file').succeeded()
  }

  /**
   * Returns the TsMorph project instance for advanced AST manipulations.
   * See https://ts-morph.com/ for documentation.
   *
   * @example
   * ```ts
   * const project = await codemods.getTsMorphProject()
   * if (project) {
   *   const sourceFile = project.getSourceFile('app/controllers/user_controller.ts')
   *   // Perform advanced AST operations
   * }
   * ```
   */
  async getTsMorphProject(): Promise<CodeTransformer['project'] | undefined> {
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
   * Define validations for the environment variables in the start/env.ts file.
   * This method updates the environment validation schema using the assembler.
   *
   * @param validations - Validation schema node for environment variables
   *
   * @example
   * ```ts
   * await codemods.defineEnvValidations({
   *   NODE_ENV: 'Env.schema.enum(["development", "production", "test"] as const)',
   *   PORT: 'Env.schema.number()',
   *   HOST: 'Env.schema.string({ format: "host" })'
   * })
   * ```
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
   * Register middleware in the start/kernel.ts file.
   * This method adds middleware to the specified stack (server, router, or named).
   *
   * @param stack - The middleware stack to register to ('server' | 'router' | 'named')
   * @param middleware - Array of middleware nodes to register
   *
   * @example
   * ```ts
   * await codemods.registerMiddleware('server', [
   *   {
   *     name: 'cors',
   *     path: '@adonisjs/cors/cors_middleware'
   *   }
   * ])
   * ```
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
   * Register bouncer policies to the list of policies collection exported from
   * the "app/policies/main.ts" file. This method adds new policy definitions
   * to the policies export.
   *
   * @param policies - Array of policy nodes to register
   *
   * @example
   * ```ts
   * await codemods.registerPolicies([
   *   {
   *     name: 'UserPolicy',
   *     path: '#policies/user_policy'
   *   }
   * ])
   * ```
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
   * Update the adonisrc.ts file with new configuration settings.
   * This method allows modification of the AdonisJS runtime configuration.
   *
   * @param params - Parameters for updating the RC file (varies based on update type)
   *
   * @example
   * ```ts
   * await codemods.updateRcFile((rcFile) => {
   *   rcFile.addCommand('make:custom')
   *   rcFile.addPreloadFile('#app/events/main')
   * })
   * ```
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
   * Register a new Vite plugin in the vite.config.ts file.
   * This method adds plugin configuration to the Vite build configuration.
   *
   * @param params - Parameters for adding the Vite plugin (varies based on plugin type)
   *
   * @example
   * ```ts
   * await codemods.registerVitePlugin({
   *   name: 'vue',
   *   import: 'import vue from "@vitejs/plugin-vue"',
   *   options: '()'
   * })
   * ```
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
   * Register a new Japa plugin in the tests/bootstrap.ts file.
   * This method adds plugin configuration to the test runner setup.
   *
   * @param params - Parameters for adding the Japa plugin (varies based on plugin type)
   *
   * @example
   * ```ts
   * await codemods.registerJapaPlugin({
   *   name: 'expect',
   *   import: 'import { expect } from "@japa/expect"'
   * })
   * ```
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
   * Generate a file using a stub template
   *
   * @param stubsRoot - Root directory containing stub files
   * @param stubPath - Path to the specific stub file
   * @param stubState - Template variables for stub generation
   *
   * @example
   * ```ts
   * const result = await codemods.makeUsingStub(
   *   './stubs',
   *   'controller.stub',
   *   {
   *     filename: 'UserController',
   *     entity: { name: 'User', modelName: 'User' },
   *     resourceful: true
   *   }
   * )
   * ```
   */
  async makeUsingStub(
    stubsRoot: string,
    stubPath: string,
    stubState: Record<string, any>,
    options?: {
      contentsFromFile?: string
    }
  ): Promise<GeneratedStub> {
    const stubs = await this.#app.stubs.create()
    const stub = await stubs.build(stubPath, { source: stubsRoot })

    /**
     * Overwrite the contents of the stub output with the contents
     * of the provided file.
     */
    if (options?.contentsFromFile) {
      const source = isAbsolute(options.contentsFromFile)
        ? options.contentsFromFile
        : this.#app.makePath(options.contentsFromFile)

      try {
        debug('overwriting stub output with contents from file %s', source)
        stub.replaceWith(await readFile(source, 'utf-8'))
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(
            `Cannot replace stub output with "${options.contentsFromFile}" file contents as the file is missing`,
            { cause: error }
          )
        }
        throw error
      }
    }

    const output = await stub.generate({ force: this.overwriteExisting, ...stubState })
    debug('generating file %O', output)

    const entityFileName = stringHelpers.toUnixSlash(this.#app.relativePath(output.destination))
    const result = { ...output, relativeFileName: entityFileName }

    if (output.status === 'skipped') {
      this.#cliLogger.action(`create ${entityFileName}`).skipped(output.skipReason)
      return result
    }

    this.#cliLogger.action(`create ${entityFileName}`).succeeded()
    return result
  }

  /**
   * Install packages using the detected or specified package manager.
   * Automatically detects npm, yarn, or pnpm and installs dependencies accordingly.
   * You can specify version of each package by setting it in the name like '@adonisjs/lucid@next'.
   *
   * @param packages - Array of packages with their dependency type
   * @param packageManager - Optional package manager to use (auto-detected if not provided)
   *
   * @example
   * ```ts
   * const success = await codemods.installPackages([
   *   { name: '@adonisjs/lucid', isDevDependency: false },
   *   { name: '@types/node', isDevDependency: true }
   * ])
   * ```
   */
  async installPackages(
    packages: { name: string; isDevDependency: boolean }[],
    packageManager?: SupportedPackageManager | 'pnpm@6' | 'deno'
  ): Promise<boolean> {
    const transformer = await this.#getCodeTransformer()
    const appPath = this.#app.makePath()
    const colors = this.#cliLogger.getColors()
    const devDependencies = packages
      .filter((pkg) => pkg.isDevDependency)
      .map(({ name }) => {
        return name.startsWith('@adonisjs/') ? `${name}@next` : name
      })
    const dependencies = packages
      .filter((pkg) => !pkg.isDevDependency)
      .map(({ name }) => {
        return name.startsWith('@adonisjs/') ? `${name}@next` : name
      })

    if (!transformer) {
      this.#cliLogger.warning(
        'Cannot install packages. Install "@adonisjs/assembler" or manually install following packages'
      )
      this.#cliLogger.log(`devDependencies: ${devDependencies.join(',')}`)
      this.#cliLogger.log(`dependencies: ${dependencies.join(',')}`)
      return false
    }

    packageManager = packageManager ?? (await transformer.detectPackageManager(appPath)) ?? 'npm'
    const spinner = this.#cliLogger.await(`installing dependencies using ${packageManager} `)

    const silentLogs = !this.verboseInstallOutput
    if (silentLogs) {
      spinner.start()
    }

    try {
      if (dependencies.length) {
        await transformer.installPackage(dependencies, {
          cwd: appPath,
          silent: silentLogs,
          packageManager,
        })
      }

      if (devDependencies.length) {
        await transformer.installPackage(devDependencies, {
          dev: true,
          cwd: appPath,
          silent: silentLogs,
          packageManager,
        })
      }

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
      return true
    } catch (error) {
      if (silentLogs) {
        spinner.update('unable to install dependencies')
        spinner.stop()
      }
      this.#cliLogger.fatal(error)
      this.emit('error', error)
      return false
    }
  }

  /**
   * List the packages that should be installed manually.
   * This method displays installation commands for different package managers
   * when automatic installation is not available or desired.
   *
   * @param packages - Array of packages with their dependency type
   *
   * @example
   * ```ts
   * await codemods.listPackagesToInstall([
   *   { name: '@adonisjs/lucid', isDevDependency: false },
   *   { name: '@types/node', isDevDependency: true }
   * ])
   * // Output:
   * // Please install following packages
   * // npm i -D @types/node
   * // npm i @adonisjs/lucid
   * ```
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
