/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Router, Server } from '../modules/http/main.js'
import type { ApplicationService } from '../src/types.js'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.js'

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
      const logger = await resolver.make('logger')
      const config = this.app.config.get<any>('app.http')
      return new Server(this.app, encryption, emitter, logger, config)
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
      const config = this.app.config.get<any>('bodyparser')
      return new BodyParserMiddleware(config)
    })
  }

  /**
   * Registers bindings
   */
  register() {
    this.registerServer()
    this.registerRouter()
    this.registerBodyParserMiddleware()
  }
}
