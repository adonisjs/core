/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Repl } from '../modules/repl.ts'
import type { Importer } from '../types/app.ts'
import type { Emitter } from '../modules/events.ts'
import type { Kernel } from '../modules/ace/main.ts'
import type { Application } from '../modules/app.ts'
import type { TestUtils } from './test_utils/main.ts'
import type {
  HttpServerEvents,
  LookupList,
  RoutesList,
  SignedURLOptions,
  UrlFor,
  URLOptions,
} from '../types/http.ts'
import type { Dumper } from '../modules/dumper/dumper.ts'
import type { LoggerManager } from '../modules/logger.ts'
import type { HashManager } from '../modules/hash/main.ts'
import type { ManagerDriverFactory } from '../types/hash.ts'
import type { Router, Server } from '../modules/http/main.ts'
import { type EncryptionConfig } from '../types/encryption.ts'
import type { EncryptionManager } from '../modules/encryption/main.ts'
import type { ContainerResolveEventData } from '../types/container.ts'
import type { LoggerConfig, LoggerManagerConfig } from '../types/logger.ts'

/**
 * A config provider waits for the application to get booted
 * and then resolves the config. It receives an instance
 * of the application service.
 *
 * @template T - The type of configuration object that the provider resolves
 *
 * @example
 * const databaseProvider: ConfigProvider<DatabaseConfig> = {
 *   type: 'provider',
 *   resolver: async (app) => {
 *     return {
 *       connection: app.env.get('DB_CONNECTION', 'sqlite'),
 *       host: app.env.get('DB_HOST', 'localhost')
 *     }
 *   }
 * }
 */
export type ConfigProvider<T> = {
  /** Identifies this as a config provider */
  type: 'provider'
  /** Function that resolves the configuration using the application service */
  resolver: (app: ApplicationService) => Promise<T>
}

/**
 * Options accepted by ignitor for configuring the application bootstrap process.
 *
 * @example
 * const options: IgnitorOptions = {
 *   importer: (filePath) => import(filePath)
 * }
 */
export type IgnitorOptions = {
  /** Optional custom importer function for loading modules */
  importer?: Importer
}

/**
 * A list of known events. The interface must be extended in
 * user land code or packages to register events and their
 * types.
 *
 * @example
 * // Extending EventsList in user code
 * declare module '@adonisjs/core' {
 *   interface EventsList {
 *     'user:created': { user: User }
 *     'order:placed': { orderId: string, amount: number }
 *   }
 * }
 */
export interface EventsList extends HttpServerEvents {
  /** Event fired when a container binding is resolved */
  'container_binding:resolved': ContainerResolveEventData<ContainerBindings>
  /** Event fired when the HTTP server is ready and listening */
  'http:server_ready': { port: number; host: string; duration: [number, number] }
}

/**
 * The loggers list inferred from the user application
 * config. This interface should be extended in user code
 * to register custom loggers.
 *
 * @example
 * // Extending LoggersList in user code
 * declare module '@adonisjs/core' {
 *   interface LoggersList {
 *     default: LoggerConfig
 *     file: LoggerConfig
 *   }
 * }
 */
export interface LoggersList {}

/**
 * Utility type to infer logger configurations from a LoggerManagerConfig.
 *
 * @template T - The logger manager configuration type
 */
export type InferLoggers<T extends LoggerManagerConfig<any>> = T['loggers']

/**
 * A list of known hashers inferred from the user config.
 * This interface should be extended in user code to register
 * custom hashers.
 *
 * @example
 * // Extending HashersList in user code
 * declare module '@adonisjs/core' {
 *   interface HashersList {
 *     scrypt: ManagerDriverFactory
 *     argon: ManagerDriverFactory
 *   }
 * }
 */
export interface HashersList {}

/**
 * Utility type to infer hasher configurations from a config provider.
 *
 * @template T - The config provider type that resolves to an object with a 'list' property
 */
export type InferHashers<T extends ConfigProvider<{ list: Record<string, ManagerDriverFactory> }>> =
  Awaited<ReturnType<T['resolver']>>['list']

/**
 * A list of known encryptors inferred from the user config.
 * This interface should be extended in user code to register
 * custom encryptors.
 *
 * @example
 * // Extending EncryptorsList in user code
 * declare module '@adonisjs/core' {
 *   interface EncryptorsList {
 *     default: EncryptionConfig
 *     secondary: EncryptionConfig
 *   }
 * }
 */
export interface EncryptorsList {}

/**
 * Utility type to infer encryptors configurations from a config provider.
 *
 * @template T - The config provider type that resolves to an object with a 'list' property
 */
export type InferEncryptors<
  T extends ConfigProvider<{
    list: Record<string, EncryptionConfig>
  }>,
> = Awaited<ReturnType<T['resolver']>>['list']

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
 * the container. It provides access to the core application
 * instance with all registered bindings.
 */
export interface ApplicationService extends Application<
  ContainerBindings extends Record<any, any> ? ContainerBindings : never
> {}

/**
 * Logger service is a singleton logger instance registered
 * to the container. It provides access to configured loggers.
 */
export interface LoggerService extends LoggerManager<
  LoggersList extends Record<string, LoggerConfig> ? LoggersList : never
> {}

/**
 * Emitter service is a singleton emitter instance registered
 * to the container. It provides type-safe event emission and listening.
 */
export interface EmitterService extends Emitter<EventsList> {}

/**
 * Encryption service is a singleton instance of the EncryptionManager
 * registered in the container. It provides encryption and decryption
 * functionality with support for multiple encryptors.
 */
export interface EncryptionService extends EncryptionManager<
  EncryptorsList extends Record<string, EncryptionConfig> ? EncryptorsList : never
> {}

/**
 * Http server service added to the container as a singleton.
 * It provides access to the HTTP server instance for handling
 * requests and responses.
 */
export interface HttpServerService extends Server {}

/**
 * Http router service added to the container as a singleton.
 * It provides access to the application's router for defining
 * and managing routes.
 */
export interface HttpRouterService extends Router {}

/**
 * Url builder service offers a type-safe API for creating URLs
 * for pre-registered routes. It ensures type safety when building
 * URLs with parameters.
 */
export interface UrlBuilderUrlFor extends UrlFor<
  RoutesList extends LookupList ? RoutesList : never,
  URLOptions
> {}

/**
 * Url builder service offers a type-safe API for creating signed URLs
 * for pre-registered routes. Signed URLs include a signature that prevents
 * tampering and can have expiration times.
 */
export interface UrlBuilderSignedUrlFor extends UrlFor<
  RoutesList extends LookupList ? RoutesList : never,
  SignedURLOptions
> {}

/**
 * Hash service is a singleton instance of the HashManager
 * registered in the container. It provides password hashing
 * and verification functionality.
 */
export interface HashService extends HashManager<
  HashersList extends Record<string, ManagerDriverFactory> ? HashersList : never
> {}

/**
 * A list of known container bindings. This interface defines
 * all the services that are registered in the IoC container
 * and available for dependency injection.
 */
export interface ContainerBindings {
  /** Ace command-line kernel */
  ace: Kernel
  /** Database query dumper */
  dumper: Dumper
  /** Main application instance */
  app: ApplicationService
  /** Logger manager instance */
  logger: LoggerService
  /** Application configuration */
  config: ApplicationService['config']
  /** Event emitter instance */
  emitter: EmitterService
  /** Encryption service */
  encryption: EncryptionService
  /** Hash manager for password hashing */
  hash: HashService
  /** HTTP server instance */
  server: HttpServerService
  /** HTTP router instance */
  router: HttpRouterService
  /** Test utilities */
  testUtils: TestUtils
  /** REPL instance */
  repl: Repl
}

/**
 * Configuration options for the IndexEntities assembler hook.
 * This type defines the settings for automatically generating
 * barrel files for controllers, listeners, and events.
 *
 * @example
 * // Basic configuration
 * const config: IndexEntitiesConfig = {
 *   controllers: { enabled: true },
 *   events: { source: 'app/custom-events' }
 * }
 *
 * @example
 * // Detailed configuration with custom paths
 * const config: IndexEntitiesConfig = {
 *   controllers: {
 *     enabled: true,
 *     source: 'app/http/controllers',
 *     importAlias: '#controllers',
 *     glob: ['**\/*_controller.ts']
 *   },
 *   listeners: {
 *     enabled: false
 *   }
 * }
 */
export type IndexEntitiesConfig = {
  /** Configuration for controllers indexing */
  controllers?: {
    /** Whether to enable controllers indexing */
    enabled?: boolean
    /** Source directory for controllers */
    source?: string
    /** Import alias for controllers */
    importAlias?: string
    /** Glob patterns for matching controller files */
    glob?: string[]
    /** Path segments to skip from generated keys. Defaults to ['controllers'] */
    skipSegments?: string[]
  }
  /** Configuration for listeners indexing */
  listeners?: {
    /** Whether to enable listeners indexing */
    enabled?: boolean
    /** Source directory for listeners */
    source?: string
    /** Import alias for listeners */
    importAlias?: string
    /** Glob patterns for matching listener files */
    glob?: string[]
    /** Path segments to skip from generated keys. Defaults to ['listeners'] */
    skipSegments?: string[]
  }
  /** Configuration for events indexing */
  events?: {
    /** Whether to enable events indexing */
    enabled?: boolean
    /** Source directory for events */
    source?: string
    /** Import alias for events */
    importAlias?: string
    /** Glob patterns for matching event files */
    glob?: string[]
    /** Path segments to skip from generated keys. Defaults to ['events'] */
    skipSegments?: string[]
  }
  /** Configuration for transformers indexing */
  transformers?: {
    /** Whether to enable transformers indexing */
    enabled?: boolean
    /** Whether to include shared props in transformers */
    withSharedProps?: boolean
    /** Source directory for transformers */
    source?: string
    /** Import alias for transformers */
    importAlias?: string
    /** Glob patterns for matching transformer files */
    glob?: string[]
    /** Path segments to skip from generated keys. Defaults to ['transformers'] */
    skipSegments?: string[]
  }
  /** Configuration for manifest generation */
  manifest?: {
    /** Whether to enable manifest generation */
    enabled?: boolean
    exclude?: string[]
  }
}
