/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseCommand from './_base.js'
import { args } from '../../modules/ace/main.js'

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
    const output = await this.generate(this.stubPath, {
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Registering the provider with the `.adonisrc.json` file. We register
     * the relative path, since we cannot be sure about aliases to exist.
     */
    const providerImportPath = `./${this.app
      .relativePath(output.destination)
      .replace(/(\.js|\.ts)$/, '')}.js`

    await this.app.rcFileEditor.addProvider(providerImportPath).save()
  }
}
