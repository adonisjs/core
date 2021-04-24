/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Stats } from 'fs'
import staticServer from 'serve-static'
import { AssetsConfig } from '@ioc:Adonis/Core/Static'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * A simple server hook to serve static files from the public directory.
 * The public directory must be configured within the `.adonisrc.json`
 * file.
 */
export class ServeStatic {
  private serve = staticServer(
    this.publicPath,
    Object.assign({}, this.config, {
      setHeaders: (res: any, path: string, stats: Stats) => {
        const headers = res.parent.getHeaders()
        Object.keys(headers).forEach((key) => {
          res.setHeader(key, headers[key])
        })

        /**
         * Set user defined custom headers
         */
        if (typeof this.config.headers === 'function') {
          const customHeaders = this.config.headers(path, stats)
          Object.keys(customHeaders).forEach((key) => {
            res.setHeader(key, customHeaders[key])
          })
        }
      },
    })
  )

  constructor(private publicPath: string, private config: AssetsConfig) {}

  /**
   * Handle the request to serve static files.
   */
  public async handle({ request, response }: HttpContextContract): Promise<void> {
    return new Promise((resolve) => {
      function next() {
        response.response.removeListener('finish', next)
        resolve()
      }

      response.response['parent'] = response

      /**
       * Whether or not the file has been served by serve static, we
       * will cleanup the finish event listener.
       *
       * 1. If file has been served, then the `finish` callback get invoked.
       * 2. If file has not been served, then callback (3rd argument) will
       *    get invoked.
       */
      response.response.addListener('finish', next)
      this.serve(request.request, response.response, next)
    })
  }
}
