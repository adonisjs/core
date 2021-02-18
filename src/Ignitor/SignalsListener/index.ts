/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Exposes the API to invoke a callback when `SIGTERM` or
 * `SIGINT` signals are received.
 */
export class SignalsListener {
  protected onCloseCallback?: () => Promise<void>

  private isKilling = false

  /**
   * Invoke callback and exit process
   */
  private kill = async () => {
    if (!this.isKilling) {
      // First attempt. Try to kill the process gracefully.
      this.isKilling = true
      if (process.stderr.isTTY) {
        // If the process is running in a terminal, display a message to the user.
        console.error('Gracefully shutting down the process... Press CTRL+C to force it')
      }
      try {
        await this.onCloseCallback()
        process.exit(0)
      } catch (error) {
        // TODO: log error?
        process.exit(1)
      }
    } else {
      // Second attempt. Force process termination.
      process.exit(0)
    }
  }

  constructor(private application: ApplicationContract) {}

  /**
   * Listens for exit signals and invokes the given
   * callback
   */
  public listen(callback: () => Promise<void>) {
    this.onCloseCallback = callback
    process.on('SIGINT', this.kill)
    process.on('SIGTERM', this.kill)

    /**
     * Cleanup on uncaught exceptions.
     */
    process.on('uncaughtException', (error) => {
      if (this.application.environment === 'repl') {
        this.application.logger.fatal(error, '"uncaughtException" detected')
        return
      }

      this.application.logger.fatal(error, '"uncaughtException" detected. Process will shutdown')
      process.exit(1)
    })
  }

  /**
   * Cleanup event listeners
   */
  public cleanup() {
    process.removeListener('SIGINT', this.kill)
    process.removeListener('SIGTERM', this.kill)
    this.onCloseCallback = undefined
  }
}
