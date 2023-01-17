/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Config } from '../modules/config.js'
import { Emitter } from '../modules/events.js'
import { Encryption } from '../modules/encryption.js'
import { Logger, LoggerManager } from '../modules/logger.js'
import type { AbstractConstructor } from '../types/container.js'
import type { ApplicationService, EmitterService, LoggerService } from '../src/types.js'

/**
 * The Application Service provider registers all the base line features required
 * to run the framework.
 */
export default class AppServiceProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers the application to the container
   */
  protected registerApp() {
    this.app.container.singleton('app', () => this.app)
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
    const LoggerServiceManager = LoggerManager as unknown as AbstractConstructor<LoggerService>
    this.app.container.singleton(LoggerServiceManager, () => {
      const config = this.app.config.get<any>('app.logger')
      return new LoggerManager(config) as LoggerService
    })
    this.app.container.alias('logger', LoggerServiceManager)
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
    this.app.container.singleton<AbstractConstructor<EmitterService>>(Emitter, () => {
      return new Emitter(this.app)
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
   * Registers bindings
   */
  register() {
    this.registerApp()
    this.registerLoggerManager()
    this.registerLogger()
    this.registerConfig()
    this.registerEmitter()
    this.registerEncryption()
  }
}
