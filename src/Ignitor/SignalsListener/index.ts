/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

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
      await this.onCloseCallback()
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  }.bind(this)

  /**
   * Listens for exit signals and invokes the given
   * callback
   */
  public listen (callback: () => Promise<void>) {
    this.onCloseCallback = callback
    if (process.env.pm_id) {
      process.on('SIGINT', this.kill)
    }

    process.on('SIGTERM', this.kill)
  }

  /**
   * Cleanup event listeners
   */
  public cleanup () {
    process.removeListener('SIGINT', this.kill)
    process.removeListener('SIGTERM', this.kill)
    this.onCloseCallback = undefined
  }
}
