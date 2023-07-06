/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '../src/types.js'

export default class ReplServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the REPL binding
   */
  register() {
    this.app.container.singleton('repl', async () => {
      const { Repl } = await import('../modules/repl.js')
      return new Repl()
    })
  }

  /**
   * Registering REPL bindings during provider boot
   */
  async boot() {
    if (this.app.getEnvironment() === 'repl') {
      const repl = await this.app.container.make('repl')
      const { defineReplBindings } = await import('../src/bindings/repl.js')
      defineReplBindings(this.app, repl)
    }
  }
}
