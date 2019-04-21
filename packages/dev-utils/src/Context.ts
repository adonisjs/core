/*
* @adonisjs/dev-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Socket } from 'net'
import { IncomingMessage, ServerResponse } from 'http'

type FakeContextConfig = {
  url: string,
  headers: any,
  params: any,
  subdomains: any,
  req: IncomingMessage,
  res: ServerResponse,
}

/**
 * FakeHttpContext to be used for testing Adonisjs addons. The real apps
 * should never fake HTTP calls and always hit actual routes.
 */
export class FakeHttpContext<Request extends any, Response extends any> {
  /**
   * Reference to fake route
   */
  public route = {
    middleware: [],
    handler: async () => {},
    meta: {},
    pattern: this._config.url || '/',
  }

  /**
   * Route runtime params
   */
  public params = this._config.params || {}

  /**
   * Route runtime domains
   */
  public subdomains = this._config.subdomains || {}

  /**
   * Reference to @adonisjs/request and @adonisjs/response. We cannot install them
   * as dependencies, since this package is meant to be used by these packages
   * as well, so they must be passed by the end user
   */
  public request: Request
  public response: Response

  constructor (
    request: { new (req: IncomingMessage, res: ServerResponse, config: any): Request },
    response: { new (req: IncomingMessage, res: ServerResponse, config: any): Response },
    private _config: Partial<FakeContextConfig>,
  ) {
    const req = this._config.req || new IncomingMessage(new Socket())
    const res = this._config.res || new ServerResponse(req)

    this.request = new request(req, res, {})
    this.response = new response(req, res, {})

    /**
     * Set request url
     */
    this.request.request.url = this._config.url || '/'

    /**
     * Set request headers (if defined)
     */
    if (this._config.headers) {
      this.request.request.headers = this._config.headers
    }
  }
}
