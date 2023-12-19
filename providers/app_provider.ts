/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Config } from '../modules/config.js'
import { Logger } from '../modules/logger.js'
import { Application } from '../modules/app.js'
import { BaseEvent, Emitter } from '../modules/events.js'
import { Encryption } from '../modules/encryption.js'
import { Router, Server } from '../modules/http/main.js'
import type { ApplicationService, LoggerService } from '../src/types.js'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.js'

/**
 * The Application Service provider registers all the baseline
 * features required to run the framework.
 */
export default class AppServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers test utils with the container
   */
  protected registerTestUtils() {
    this.app.container.singleton('testUtils', async () => {
      const { TestUtils } = await import('../src/test_utils/main.js')
      return new TestUtils(this.app)
    })
  }

  /**
   * Registers ace with the container
   */
  protected registerAce() {
    this.app.container.singleton('ace', async () => {
      const { createAceKernel } = await import('../modules/ace/create_kernel.js')
      return createAceKernel(this.app)
    })
  }

  /**
   * Registers the application to the container
   */
  protected registerApp() {
    this.app.container.singleton(Application, () => this.app)
    this.app.container.alias('app', Application)
  }

  /**
   * Registers the logger class to resolve the default logger
   */
  protected registerLogger() {
    this.app.container.singleton(Logger, async (resolver) => {
      const loggerManager = await resolver.make('logger')
      return loggerManager.use()
    })
  }

  /**
   * Registers the logger manager to the container
   */
  protected registerLoggerManager() {
    this.app.container.singleton('logger', async () => {
      const { LoggerManager } = await import('../modules/logger.js')
      const config = this.app.config.get<any>('logger')
      return new LoggerManager<any>(config) as LoggerService
    })
  }

  /**
   * Registers the config to the container
   */
  protected registerConfig() {
    this.app.container.singleton(Config, () => this.app.config)
    this.app.container.alias('config', Config)
  }

  /**
   * Registers emitter service to the container
   */
  protected registerEmitter() {
    this.app.container.singleton(Emitter, async () => {
      return new Emitter(this.app) as Emitter<any>
    })
    this.app.container.alias('emitter', Emitter)
  }

  /**
   * Register the encryption service to the container
   */
  protected registerEncryption() {
    this.app.container.singleton(Encryption, () => {
      const appKey = this.app.config.get<string>('app.appKey')
      return new Encryption({ secret: appKey })
    })
    this.app.container.alias('encryption', Encryption)
  }

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
    this.registerApp()
    this.registerAce()
    this.registerLoggerManager()
    this.registerLogger()
    this.registerConfig()
    this.registerEmitter()
    this.registerEncryption()
    this.registerTestUtils()
    this.registerServer()
    this.registerRouter()
    this.registerBodyParserMiddleware()
  }

  async boot() {
    BaseEvent.useEmitter(await this.app.container.make('emitter'))
  }
}
