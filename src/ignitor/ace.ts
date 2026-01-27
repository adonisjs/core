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
 * The Ace process is used to start the application in the
 * console environment. It manages the Ace kernel lifecycle
 * and command execution.
 *
 * @example
 * const ignitor = new Ignitor()
 * const aceProcess = new AceProcess(ignitor)
 *
 * await aceProcess
 *   .configure((app) => {
 *     // Configure ace kernel
 *   })
 *   .handle(['make:controller', 'UserController'])
 */
export class AceProcess {
  /**
   * Ignitor reference
   */
  #ignitor: Ignitor

  /**
   * The callback that configures the ace instance before the
   * handle method is called
   */
  #configureCallback: (app: ApplicationService) => Promise<void> | void = () => {}

  /**
   * Creates a new Ace process instance
   *
   * @param ignitor - The ignitor instance used to create and manage the app
   */
  constructor(ignitor: Ignitor) {
    this.#ignitor = ignitor
  }

  /**
   * Register a callback that can be used to configure the ace
   * kernel before the handle method is called
   *
   * @param callback - Configuration callback function
   */
  configure(callback: (app: ApplicationService) => Promise<void> | void): this {
    this.#configureCallback = callback
    return this
  }

  /**
   * Handles the command line arguments and executes
   * the matching ace commands
   *
   * @param argv - Command line arguments array
   */
  async handle(argv: string[]) {
    const app = this.#ignitor.createApp('console')
    await app.init()

    const { createAceKernel } = await import('../../modules/ace/create_kernel.js')
    const commandNameIndex = argv.findIndex((value) => !value.startsWith('-'))
    const commandName = argv[commandNameIndex]

    const kernel = createAceKernel(app, commandName)
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
        if (metaData.commandName === 'repl') {
          app.setEnvironment('repl')
        }
        await app.boot()
        await app.start(() => {})
      }
    })

    await this.#configureCallback(app)

    /**
     * Register terminating callback BEFORE handling the command.
     * This ensures the callback is registered even if a staysAlive
     * command calls app.terminate() during its execution.
     */
    app.terminating(() => {
      const mainCommand = kernel.getMainCommand()
      if (mainCommand?.staysAlive) {
        process.exitCode = mainCommand.exitCode
      }
    })

    /**
     * Handle command line args
     */
    await kernel.handle(argv)

    /**
     * Terminate the app when the command does not want to
     * hold a long running process
     */
    const mainCommand = kernel.getMainCommand()
    if (!mainCommand || !mainCommand.staysAlive) {
      process.exitCode = kernel.exitCode
      await app.terminate()
    }
  }
}
