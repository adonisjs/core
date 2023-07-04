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
import { Encryption } from '../modules/encryption.js'
import type { ApplicationService, LoggerService } from '../src/types.js'

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
    this.app.container.singleton('logger', async () => {
      const { LoggerManager } = await import('../modules/logger.js')
      const config = this.app.config.get<any>('logger')
      return new LoggerManager(config) as LoggerService
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
    this.app.container.singleton('emitter', async () => {
      const { Emitter } = await import('../modules/events.js')
      return new Emitter(this.app)
    })
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
    this.registerAce()
    this.registerLoggerManager()
    this.registerLogger()
    this.registerConfig()
    this.registerEmitter()
    this.registerEncryption()
    this.registerTestUtils()
  }
}
