/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '../src/types.js'

export default class VineJSServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registering AdonisJS specific VineJS rules
   */
  async boot() {
    await import('../modules/http/request_validator.js')
    await import('../src/bindings/vinejs.js')
  }
}
