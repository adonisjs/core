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
 * The Ace process is used to start the application in the
 * console environment.
 */
export class AceProcess {
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
   * Handles the command line arguments and executes
   * the matching ace commands
   */
  async handle(argv: string[]) {
    const app = this.#ignitor.createApp('console')
    await app.init()

    const { createAceKernel } = await import('../../modules/ace/create_kernel.js')

    const kernel = createAceKernel(app)
    app.container.bindValue('ace', kernel)

    /**
     * Hook into kernel and start the app when the
     * command needs the app.
     *
     * Since multiple commands can be executed in a single process,
     * we add a check to only start the app only once.
     */
    kernel.loading(async (metaData) => {
      if (metaData.options.startApp && !app.isReady) {
        await app.boot()
        await app.start(() => {})
      }
    })

    await this.#configureCallback(app)

    /**
     * Handle command line args
     */
    await kernel.handle(argv)

    /**
     * Update the process exit code
     */
    process.exitCode = kernel.exitCode

    /**
     * Terminate the app when the command does not want to
     * hold a long running process
     */
    const mainCommand = kernel.getMainCommand()
    if (!mainCommand || !mainCommand.staysAlive) {
      await app.terminate()
    }
  }
}
