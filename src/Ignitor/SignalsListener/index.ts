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
  /**
   * Invoke callback and exit process
   */
  private async _kill (callback: () => Promise<void>) {
    try {
      await callback()
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  }

  /**
   * Listens for exit signals and invokes the given
   * callback
   */
  public listen (callback: () => Promise<void>) {
    if (process.env.pm_id) {
      process.on('SIGINT', () => this._kill(callback))
    }

    process.on('SIGTERM', () => this._kill(callback))
  }
}
