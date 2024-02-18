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

import { stubsRoot } from '../../stubs/main.js'
import type { AppEnvironments } from '../../types/app.js'
import { args, BaseCommand, flags } from '../../modules/ace/main.js'

const ALLOWED_ENVIRONMENTS = ['web', 'console', 'test', 'repl'] satisfies AppEnvironments[]
type AllowedAppEnvironments = typeof ALLOWED_ENVIRONMENTS

/**
 * Make a new provider class
 */
export default class MakeProvider extends BaseCommand {
  static commandName = 'make:provider'
  static description = 'Create a new service provider class'

  @args.string({ description: 'Name of the provider' })
  declare name: string

  @flags.boolean({
    description: 'Auto register the provider inside the .adonisrc.ts file',
    showNegatedVariantInHelp: true,
    alias: 'r',
  })
  declare register?: boolean

  @flags.array({
    description: `Define the provider environment. Accepted values are "${ALLOWED_ENVIRONMENTS}"`,
    alias: 'e',
  })
  declare environments?: AllowedAppEnvironments

  /**
   * The stub to use for generating the provider class
   */
  protected stubPath: string = 'make/provider/main.stub'

  /**
   * Validate the environments flag passed by the user
   */
  #isEnvironmentsFlagValid() {
    if (!this.environments || !this.environments.length) {
      return true
    }
    return this.environments.every((one) => ALLOWED_ENVIRONMENTS.includes(one))
  }

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
     * Creative relative path for the provider file from
     * the "./start" directory
     */
    const providerRelativePath = slash(
      relative(this.app.providersPath(), destination).replace(extname(destination), '')
    )

    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider(`#providers/${providerRelativePath}`, this.environments)
    })
  }
}
