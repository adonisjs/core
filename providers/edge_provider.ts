/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '../src/types.js'

export default class EdgeServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Bridge AdonisJS and Edge
   */
  async boot() {
    const { bridgeEdgeAdonisJS } = await import('../src/bindings/edge.js')
    bridgeEdgeAdonisJS(this.app, await this.app.container.make('router'))
  }
}
