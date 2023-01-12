/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Emitter } from '../modules/events.js'
import type { Application } from '../modules/app.js'
import type { HashManager } from '../modules/hash.js'
import type { Router, Server } from '../modules/http.js'
import type { Encryption } from '../modules/encryption.js'
import type { LoggerConfig, LoggerManagerConfig } from '../types/logger.js'
import type { HashManagerConfig, ManagerDriversConfig } from '../types/hash.js'

/**
 * The loggers list inferred from the user application
 * config
 */
export interface LoggersList {}
export type InferLoggers<T extends LoggerManagerConfig<any>> = T['loggers']

/**
 * A list of known events. The interface must be extended in
 * user land code or packages to register events and their
 * types.
 */
export interface EventsList {}

/**
 * A list of known hashers inferred from the user config
 */
export interface HashersList {}
export type InferHashers<T extends HashManagerConfig<any>> = T['list']

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
  extends Application<
    ContainerBindings extends Record<any, any> ? ContainerBindings : never,
    LoggersList extends Record<string, LoggerConfig> ? LoggersList : never
  > {}

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
 * registered to the container
 */
export interface HashService
  extends HashManager<
    HashersList extends Record<string, ManagerDriversConfig> ? HashersList : never
  > {}

/**
 * A list of known container bindings.
 */
export interface ContainerBindings {
  app: ApplicationService
  logger: ApplicationService['logger']
  config: ApplicationService['config']
  emitter: EmitterService
  encryption: EncryptionService
  hash: HashService
  server: HttpServerService
  router: HttpRouterService
}
