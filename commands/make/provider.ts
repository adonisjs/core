/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname, relative } from 'node:path'

import { stubsRoot } from '../../stubs/main.ts'
import type { AppEnvironments } from '../../types/app.ts'
import stringHelpers from '../../src/helpers/string.ts'
import { args, BaseCommand, flags } from '../../modules/ace/main.ts'

const ALLOWED_ENVIRONMENTS = ['web', 'console', 'test', 'repl'] satisfies AppEnvironments[]
type AllowedAppEnvironments = typeof ALLOWED_ENVIRONMENTS

/**
 * Command to create a new service provider class.
 * Service providers are used to register bindings, configure services,
 * and bootstrap application components during startup.
 *
 * @example
 * ```
 * ace make:provider AuthProvider
 * ace make:provider DatabaseProvider --register
 * ace make:provider AppProvider --no-register
 * ace make:provider CacheProvider --environments=web,console
 * ```
 */
export default class MakeProvider extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:provider'

  /**
   * The command description
   */
  static description = 'Create a new service provider class'

  /**
   * Name of the service provider to create
   */
  @args.string({ description: 'Name of the provider' })
  declare name: string

  /**
   * Automatically register the provider in the .adonisrc.ts file
   */
  @flags.boolean({
    description: 'Auto register the provider inside the .adonisrc.ts file',
    showNegatedVariantInHelp: true,
    alias: 'r',
  })
  declare register?: boolean

  /**
   * Application environments where the provider should be loaded
   */
  @flags.array({
    description: `Define the provider environment. Accepted values are "${ALLOWED_ENVIRONMENTS}"`,
    alias: 'e',
  })
  declare environments?: AllowedAppEnvironments

  /**
   * Read the contents from this file (if the flag exists) and use
   * it as the raw contents
   */
  @flags.string({ description: 'Use the contents of the given file as the generated output' })
  declare contentsFrom: string

  /**
   * The stub template file to use for generating the provider class
   */
  protected stubPath: string = 'make/provider/main.stub'

  /**
   * Validate that all specified environments are valid application environments.
   *
   * @returns True if all environments are valid or none specified, false otherwise
   */
  #isEnvironmentsFlagValid() {
    if (!this.environments || !this.environments.length) {
      return true
    }
    return this.environments.every((one) => ALLOWED_ENVIRONMENTS.includes(one))
  }

  /**
   * Execute the command to create a new service provider.
   * Validates inputs, generates the provider file, and optionally registers it in .adonisrc.ts.
   */
  async run() {
    /**
     * Ensure the environments are valid when provided via flag
     */
    if (!this.#isEnvironmentsFlagValid()) {
      this.logger.error(
        `Invalid environment(s) "${this.environments}". Only "${ALLOWED_ENVIRONMENTS}" are allowed`
      )
      return
    }

    /**
     * Display prompt to know if we should register the provider
     * file inside the ".adonisrc.ts" file.
     */
    if (this.register === undefined) {
      this.register = await this.prompt.confirm(
        'Do you want to register the provider in .adonisrc.ts file?'
      )
    }

    const codemods = await this.createCodemods()
    const { destination } = await codemods.makeUsingStub(
      stubsRoot,
      this.stubPath,
      {
        flags: this.parsed.flags,
        entity: this.app.generators.createEntity(this.name),
      },
      {
        contentsFromFile: this.contentsFrom,
      }
    )

    /**
     * Do not register when prompt has been denied or "--no-register"
     * flag was used
     */
    if (!this.register) {
      return
    }

    /**
     * Creative relative path for the provider file from
     * the "./start" directory
     */
    const providerRelativePath = stringHelpers.toUnixSlash(
      relative(this.app.providersPath(), destination).replace(extname(destination), '')
    )

    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider(`#providers/${providerRelativePath}`, this.environments)
    })
  }
}
