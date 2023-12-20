/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

    const codemods = await this.createCodemods()
    const output = await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Registering the provider with the `adonisrc.js` file. We register
     * the relative path, since we cannot be sure about aliases to exist.
     */
    try {
      const providerImportPath = `./${output.relativeFileName.replace(/(\.js|\.ts)$/, '')}.js`
      await codemods.updateRcFile((rcFile) => {
        rcFile.addProvider(providerImportPath, this.environments)
      })
    } catch (_) {
      this.logger.warning(
        'Unable to register provider inside the adonisrc.ts file. Make sure to manually register it'
      )
    }
  }
}
