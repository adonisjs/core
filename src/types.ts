/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Repl } from '../modules/repl.js'
import type { Importer } from '../types/app.js'
import type { Emitter } from '../modules/events.js'
import type { Kernel } from '../modules/ace/main.js'
import type { Application } from '../modules/app.js'
import type { TestUtils } from './test_utils/main.js'
import type { HttpServerEvents } from '../types/http.js'
import type { LoggerManager } from '../modules/logger.js'
import type { HashManager } from '../modules/hash/main.js'
import type { Encryption } from '../modules/encryption.js'
import type { ManagerDriverFactory } from '../types/hash.js'
import type { Router, Server } from '../modules/http/main.js'
import type { ContainerResolveEventData } from '../types/container.js'
import type { LoggerConfig, LoggerManagerConfig } from '../types/logger.js'

/**
 * A config provider waits for the application to get booted
 * and then resolves the config. It receives an instance
 * of the application service.
 */
export type ConfigProvider<T> = {
  type: 'provider'
  resolver: (app: ApplicationService) => Promise<T>
}

/**
 * Options accepted by ignitor
 */
export type IgnitorOptions = { importer?: Importer }

/**
 * A list of known events. The interface must be extended in
 * user land code or packages to register events and their
 * types.
 */
export interface EventsList extends HttpServerEvents {
  'container_binding:resolved': ContainerResolveEventData<ContainerBindings>
  'http:server_ready': { port: number; host: string; duration: [number, number] }
}

/**
 * The loggers list inferred from the user application
 * config
 */
export interface LoggersList {}
export type InferLoggers<T extends LoggerManagerConfig<any>> = T['loggers']

/**
 * A list of known hashers inferred from the user config
 */
export interface HashersList {}
export type InferHashers<T extends ConfigProvider<{ list: Record<string, ManagerDriverFactory> }>> =
  Awaited<ReturnType<T['resolver']>>['list']

/**
 * ----------------------------------------------------------------
 * Container services
 * -----------------------------------------------------------------
 *
 * Types for the container singleton services. Defining them
 * upfront so that we do not have to define them in
 * multiple places.
 */

/**
 * Application service is a singleton resolved from
 * the container
 */
export interface ApplicationService
  extends Application<ContainerBindings extends Record<any, any> ? ContainerBindings : never> {}

/**
 * Logger service is a singleton logger instance registered
 * to the container.
 */
export interface LoggerService
  extends LoggerManager<LoggersList extends Record<string, LoggerConfig> ? LoggersList : never> {}

/**
 * Emitter service is a singleton emitter instance registered
 * to the container.
 */
export interface EmitterService extends Emitter<EventsList> {}

/**
 * Encryption service is a singleton Encryption class instance
 * registered to the container.
 */
export interface EncryptionService extends Encryption {}

/**
 * Http server service added to the container as a singleton
 */
export interface HttpServerService extends Server {}

/**
 * Http server service added to the container as a singleton
 */
export interface HttpRouterService extends Router {}

/**
 * Hash service is a singleton instance of the HashManager
 * registered in the container
 */
export interface HashService
  extends HashManager<
    HashersList extends Record<string, ManagerDriverFactory> ? HashersList : never
  > {}

/**
 * A list of known container bindings.
 */
export interface ContainerBindings {
  ace: Kernel
  app: ApplicationService
  logger: LoggerService
  config: ApplicationService['config']
  emitter: EmitterService
  encryption: EncryptionService
  hash: HashService
  server: HttpServerService
  router: HttpRouterService
  testUtils: TestUtils
  repl: Repl
}
