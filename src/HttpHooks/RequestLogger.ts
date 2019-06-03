/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as prettyMs from 'pretty-ms'
import { ServerResponse } from 'http'
import * as onFinished from 'on-finished'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { RequestLoggerConfigContract } from '@ioc:Adonis/Core/RequestLogger'

/**
 * Logs every HTTP request by hooking into HTTP server `before`
 * hook.
 */
export class RequestLogger {
  constructor (private _config: RequestLoggerConfigContract) {
  }

  /**
   * Returns request handling duration
   */
  private _getDuration (startedAt: [number, number]) {
    const diff = process.hrtime(startedAt)
    return prettyMs(((diff[0] * 1e9) + diff[1]) / 1e6)
  }

  /**
   * Returns log level based upon the response status code
   */
  private _getLogLevel (statusCode: number): Extract<keyof LoggerContract, 'info' | 'error' | 'warn'> {
    if (statusCode < 400) {
      return 'info'
    }

    if (statusCode >= 400 && statusCode < 500) {
      return 'warn'
    }

    return 'error'
  }

  /**
   * Hooks into `Server.before` and logs every HTTP request.
   */
  public async onRequest (ctx: HttpContextContract) {
    const start = process.hrtime()
    const url = ctx.request.url(true)
    const method = ctx.request.method()

    /**
     * Hook into on finish
     */
    onFinished(ctx.response.response, (error: any, res: ServerResponse) => {
      const duration = this._getDuration(start)
      const logLevel = this._getLogLevel(res.statusCode)
      const message = error ? error.message : 'http request'
      const payload = { url, method, duration }

      try {
        if (typeof (this._config.requestLogData) === 'function') {
          Object.assign(payload, this._config.requestLogData())
        }

        ctx.logger[logLevel](payload, message)
      } catch (error) {
        ctx.logger.fatal(error, `Error in request logger`)
      }
    })
  }
}
