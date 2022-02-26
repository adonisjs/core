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
 * `SIGINT (pm2 only)` signals are received.
 */
export class SignalsListener {
  protected onCloseCallback?: () => Promise<void>

  /**
   * Invoke callback and exit process
   */
  private kill = async function () {
    try {
      await Promise.race([
        this.onCloseCallback(),
        new Promise((resolve) => {
          setTimeout(resolve, 3000)
        }),
      ])
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  }.bind(this)

  constructor(private application: ApplicationContract) {}

  /**
   * Listens for exit signals and invokes the given
   * callback
   */
  public listen(callback: () => Promise<void>) {
    this.onCloseCallback = callback

    /**
     * Close on SIGINT AND SIGTERM SIGNALS
     */
    if (process.env.pm_id) {
      process.on('SIGINT', this.kill)
    }
    process.on('SIGTERM', this.kill)

    /**
     * Notify about uncaught exceptions
     */
    process.on('uncaughtExceptionMonitor', (error) => {
      this.application.logger.fatal(error, '"uncaughtException" detected')
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
