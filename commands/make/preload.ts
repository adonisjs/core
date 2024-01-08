/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import { extname, relative } from 'node:path'
import type { AppEnvironments } from '@adonisjs/application/types'

import { stubsRoot } from '../../stubs/main.js'
import { args, flags, BaseCommand } from '../../modules/ace/main.js'

const ALLOWED_ENVIRONMENTS = ['web', 'console', 'test', 'repl'] satisfies AppEnvironments[]
type AllowedAppEnvironments = typeof ALLOWED_ENVIRONMENTS

/**
 * Make a new preload file
 */
export default class MakePreload extends BaseCommand {
  static commandName = 'make:preload'
  static description = 'Create a new preload file inside the start directory'

  @args.string({ description: 'Name of the preload file' })
  declare name: string

  @flags.boolean({
    description: 'Auto register the preload file inside the .adonisrc.ts file',
    showNegatedVariantInHelp: true,
    alias: 'r',
  })
  declare register?: boolean

  @flags.array({
    description: `Define the preload file's environment. Accepted values are "${ALLOWED_ENVIRONMENTS}"`,
    alias: 'e',
  })
  declare environments?: AllowedAppEnvironments

  /**
   * The stub to use for generating the preload file
   */
  protected stubPath: string = 'make/preload/main.stub'

  /**
   * Validate the environments flag passed by the user
   */
  #isEnvironmentsFlagValid() {
    if (!this.environments || !this.environments.length) {
      return true
    }

    return this.environments.every((one) => ALLOWED_ENVIRONMENTS.includes(one))
  }

  /**
   * Run command
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
    const { destination } = await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })

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
    const preloadFileRelativePath = slash(
      relative(this.app.startPath(), destination).replace(extname(destination), '')
    )

    await codemods.updateRcFile((rcFile) => {
      rcFile.addPreloadFile(`#start/${preloadFileRelativePath}`, this.environments)
    })
  }
}
