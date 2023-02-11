/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Macroable from '@poppinss/macroable'
import { CookieClient } from '@adonisjs/http-server'

import { HttpServerUtils } from './http.js'
import type { ApplicationService } from '../types.js'

/**
 * Test utils has a collection of helper methods to make testing
 * experience great for AdonisJS applications
 */
export class TestUtils extends Macroable {
  #booted: boolean = false

  /**
   * Check if utils have been booted
   */
  get isBooted() {
    return this.#booted
  }

  declare cookies: CookieClient

  constructor(public app: ApplicationService) {
    super()
  }

  /**
   * Boot test utils. It requires the app to be booted
   * and container to have all the bindings
   */
  async boot() {
    if (!this.isBooted) {
      this.#booted = true
      this.cookies = new CookieClient(await this.app.container.make('encryption'))
    }
  }

  /**
   * Returns an instance of the HTTP server testing
   * utils
   */
  httpServer() {
    return new HttpServerUtils(this)
  }
}
