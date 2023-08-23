/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { stubsRoot } from '../../stubs/main.js'
import { args, BaseCommand } from '../../modules/ace/main.js'

/**
 * Make a new provider class
 */
export default class MakeProvider extends BaseCommand {
  static commandName = 'make:provider'
  static description = 'Create a new service provider class'

  @args.string({ description: 'Name of the provider' })
  declare name: string

  /**
   * The stub to use for generating the provider class
   */
  protected stubPath: string = 'make/provider/main.stub'

  async run() {
    const codemods = await this.createCodemods()
    const output = await codemods.makeUsingStub(stubsRoot, this.stubPath, {
      flags: this.parsed.flags,
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Registering the provider with the `adonisrc.js` file. We register
     * the relative path, since we cannot be sure about aliases to exist.
     */
    const providerImportPath = `./${output.relativeFileName.replace(/(\.js|\.ts)$/, '')}.js`
    await codemods.updateRcFile((rcFile) => {
      rcFile.addProvider(providerImportPath)
    })
  }
}
