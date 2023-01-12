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
import type { ApplicationService } from '../src/types.js'
import { Logger, LoggerManager } from '../modules/logger.js'

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
   * Registers the logger to the container
   */
  protected registerLogger() {
    this.app.container.singleton(LoggerManager, () => this.app.logger)
    this.app.container.alias('logger', LoggerManager)

    this.app.container.singleton(Logger, () => this.app.logger.use())
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
  protected registerEvents() {
    this.app.container.singleton(Emitter, () => new Emitter(this.app))
    this.app.container.alias('emitter', Emitter)
  }

  /**
   * Register the encryption service to the container
   */
  protected registerEncryption() {
    this.app.container.singleton(Encryption, () => {
      return new Encryption({ secret: this.app.config.get<string>('app.appKey', '') })
    })
    this.app.container.alias('encryption', Encryption)
  }

  register() {
    this.registerApp()
    this.registerLogger()
    this.registerConfig()
    this.registerEvents()
    this.registerEncryption()
  }
}
