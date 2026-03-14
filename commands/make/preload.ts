/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname, relative } from 'node:path'
import type { AppEnvironments } from '@adonisjs/application/types'

import { stubsRoot } from '../../stubs/main.ts'
import stringHelpers from '../../src/helpers/string.ts'
import { args, flags, BaseCommand } from '../../modules/ace/main.ts'

const ALLOWED_ENVIRONMENTS = ['web', 'console', 'test', 'repl'] satisfies AppEnvironments[]
type AllowedAppEnvironments = typeof ALLOWED_ENVIRONMENTS

/**
 * Command to create a new preload file in the start directory.
 * Preload files are executed during application startup and can be used
 * to set up global configurations, register global bindings, or perform
 * application-wide initialization tasks.
 *
 * @example
 * ```
 * ace make:preload routes
 * ace make:preload database --register
 * ace make:preload events --no-register
 * ace make:preload kernel --environments=web,console
 * ```
 */
export default class MakePreload extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'make:preload'

  /**
   * The command description
   */
  static description =
    'Create a new preload file in start/ and optionally register it in adonisrc.ts. Preload files run during app boot'

  /**
   * Name of the preload file to create
   */
  @args.string({ description: 'Name of the preload file' })
  declare name: string

  /**
   * Automatically register the preload file in the .adonisrc.ts file
   */
  @flags.boolean({
    description: 'Auto register the preload file inside the .adonisrc.ts file',
    showNegatedVariantInHelp: true,
    alias: 'r',
  })
  declare register?: boolean

  /**
   * Application environments where the preload file should be loaded
   */
  @flags.array({
    description: `Define the preload file's environment. Accepted values are "${ALLOWED_ENVIRONMENTS}"`,
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
   * The stub template file to use for generating the preload file
   */
  protected stubPath: string = 'make/preload/main.stub'

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
   * Execute the command to create a new preload file.
   * Validates inputs, generates the preload file, and optionally registers it in .adonisrc.ts.
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
     * Display prompt to know if we should register the preload
     * file inside the ".adonisrc.ts" file.
     */
    if (this.register === undefined) {
      this.register = await this.prompt.confirm(
        'Do you want to register the preload file in .adonisrc.ts file?'
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
     * Creative relative path for the preload file from
     * the "./start" directory
     */
    const preloadFileRelativePath = stringHelpers.toUnixSlash(
      relative(this.app.startPath(), destination).replace(extname(destination), '')
    )

    await codemods.updateRcFile((rcFile) => {
      rcFile.addPreloadFile(`#start/${preloadFileRelativePath}`, this.environments)
    })
  }
}
