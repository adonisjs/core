/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

    const codemods = await this.createCodemods()
    const output = await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Registering the preload file with the `adonisrc.ts` file. We register
     * the relative path, since we cannot be sure about aliases to exist.
     */
    try {
      const preloadImportPath = `./${output.relativeFileName.replace(/(\.js|\.ts)$/, '')}.js`
      await codemods.updateRcFile((rcFile) => {
        rcFile.addPreloadFile(preloadImportPath, this.environments)
      })
    } catch (_) {
      this.logger.warning(
        'Unable to register preload file inside the adonisrc.ts file. Make sure to manually register it'
      )
    }
  }
}
