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
 * Make a new preload file
 */
export default class MakePreloadFile extends BaseCommand {
  static commandName = 'make:prldfile'
  static description = 'Create a new preload file inside the start directory'

  @args.string({ description: 'Name of the preload file' })
  declare name: string

  /**
   * The stub to use for generating the preload file
   */
  protected stubPath: string = 'make/preload_file/main.stub'

  async run() {
    const output = await this.generate(this.stubPath, {
      entity: this.app.generators.createEntity(this.name),
    })

    /**
     * Registering the preload file with the `.adonisrc.json` file. We register
     * the relative path, since we cannot be sure about aliases to exist.
     */
    const preloadImportPath = `./${output.relativeFileName.replace(/(\.js|\.ts)$/, '')}.js`
    await this.app.rcFileEditor.addPreloadFile(preloadImportPath).save()
  }
}
