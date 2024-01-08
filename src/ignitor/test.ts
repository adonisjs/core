/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from './main.js'
import type { ApplicationService } from '../types.js'

/**
 * The Test runner process is used to start the tests runner process
 */
export class TestRunnerProcess {
  /**
   * Ignitor reference
   */
  #ignitor: Ignitor

  /**
   * The callback that configures the tests runner. This callback
   * runs at the time of starting the app.
   */
  #configureCallback: (app: ApplicationService) => Promise<void> | void = () => {}

  constructor(ignitor: Ignitor) {
    this.#ignitor = ignitor
  }

  /**
   * Register a callback that runs after booting the AdonisJS app
   * and just before the provider's ready hook
   */
  configure(callback: (app: ApplicationService) => Promise<void> | void): this {
    this.#configureCallback = callback
    return this
  }

  /**
   * Runs a callback after starting the app
   */
  async run(callback: (app: ApplicationService) => Promise<void> | void) {
    const app = this.#ignitor.createApp('test')
    await app.init()
    await app.boot()
    await app.start(this.#configureCallback)
    await callback(app)
  }
}
