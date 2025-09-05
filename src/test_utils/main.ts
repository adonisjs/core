/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Socket } from 'node:net'
import Macroable from '@poppinss/macroable'
import { IncomingMessage, ServerResponse } from 'node:http'

import { HttpServerUtils } from './http.ts'
import type { ApplicationService } from '../types.ts'
import { CookieClient, type HttpContext } from '../../modules/http/main.ts'

/**
 * Test utils has a collection of helper methods to make testing
 * experience great for AdonisJS applications. It provides utilities
 * for HTTP testing, context creation, and cookie handling.
 *
 * @example
 * const testUtils = new TestUtils(app)
 * await testUtils.boot()
 *
 * const ctx = await testUtils.createHttpContext()
 * const httpUtils = testUtils.httpServer()
 */
export class TestUtils extends Macroable {
  /**
   * Flag to track if test utils have been booted
   */
  #booted: boolean = false

  /**
   * Check if utils have been booted
   */
  get isBooted() {
    return this.#booted
  }

  /**
   * Cookie client instance for handling cookies in tests
   */
  declare cookies: CookieClient

  /**
   * Creates a new TestUtils instance
   *
   * @param app - The application service instance
   */
  constructor(public app: ApplicationService) {
    super()
  }

  /**
   * Boot test utils. It requires the app to be booted
   * and container to have all the bindings
   */
  async boot() {
    if (!this.isBooted) {
      this.#booted = true
      this.cookies = new CookieClient(await this.app.container.make('encryption'))
    }
  }

  /**
   * Returns an instance of the HTTP server testing
   * utils
   */
  httpServer() {
    return new HttpServerUtils(this)
  }

  /**
   * Create an instance of HTTP context for testing
   *
   * @param options - Options for creating HTTP context with custom req/res objects
   */
  async createHttpContext(
    options: { req?: IncomingMessage; res?: ServerResponse } = {}
  ): Promise<HttpContext> {
    const req = options.req || new IncomingMessage(new Socket())
    const res = options.res || new ServerResponse(req)
    const server = await this.app.container.make('server')

    const request = server.createRequest(req, res)
    const response = server.createResponse(req, res)
    return server.createHttpContext(request, response, this.app.container.createResolver())
  }
}
