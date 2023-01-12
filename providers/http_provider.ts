/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Router, Server } from '../modules/http.js'
import type { ApplicationService } from '../src/types.js'
import BodyParserMiddleware from '../modules/bodyparser_middleware.js'

/**
 * Http Service provider binds the router and the HTTP server to
 * the container.
 */
export default class HttpServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the HTTP server with the container as a singleton
   */
  protected registerServer() {
    this.app.container.singleton(Server, async (resolver) => {
      const encryption = await resolver.make('encryption')
      const emitter = await resolver.make('emitter')
      return new Server(this.app, encryption, emitter, this.app.config.get('http', {}))
    })

    this.app.container.alias('server', Server)
  }

  /**
   * Registers router with the container as a singleton
   */
  protected registerRouter() {
    this.app.container.singleton(Router, async (resolver) => {
      const server = await resolver.make('server')
      return server.getRouter()
    })
    this.app.container.alias('router', Router)
  }

  /**
   * Self construct bodyparser middleware class, since it needs
   * config that cannot be resolved by the container
   */
  protected registerBodyParserMiddleware() {
    this.app.container.bind(BodyParserMiddleware, () => {
      return new BodyParserMiddleware(this.app.config.get('bodyparser', {}))
    })
  }

  register() {
    this.registerServer()
    this.registerRouter()
    this.registerBodyParserMiddleware()
  }
}
