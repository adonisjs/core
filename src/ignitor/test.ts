/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type Ignitor } from './main.ts'
import type { ApplicationService } from '../types.ts'

/**
 * The Test runner process is used to start the tests runner process.
 * It provides lifecycle hooks for configuring the test environment
 * and running tests within the AdonisJS application context.
 *
 * @example
 * const ignitor = new Ignitor()
 * const testProcess = new TestRunnerProcess(ignitor)
 *
 * await testProcess
 *   .configure((app) => {
 *     // Configure test environment
 *   })
 *   .run(async (app) => {
 *     // Run your tests
 *   })
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

  /**
   * Creates a new test runner process instance
   *
   * @param ignitor - The ignitor instance used to create and manage the app
   */
  constructor(ignitor: Ignitor) {
    this.#ignitor = ignitor
  }

  /**
   * Register a callback that runs after booting the AdonisJS app
   * and just before the provider's ready hook
   *
   * @param callback - Configuration callback function
   */
  configure(callback: (app: ApplicationService) => Promise<void> | void): this {
    this.#configureCallback = callback
    return this
  }

  /**
   * Runs a callback after starting the app
   *
   * @param callback - Test execution callback function
   */
  async run(callback: (app: ApplicationService) => Promise<void> | void) {
    const app = this.#ignitor.createApp('test')
    await app.init()
    await app.boot()
    await app.start(this.#configureCallback)
    await callback(app)
  }
}
