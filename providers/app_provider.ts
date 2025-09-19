/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

import { Config } from '../modules/config.ts'
import { Logger } from '../modules/logger.ts'
import { Application } from '../modules/app.ts'
import { Dumper } from '../modules/dumper/dumper.ts'
import { HttpContext } from '../modules/http/main.ts'
import { Encryption } from '../modules/encryption.ts'
import { Router, Server } from '../modules/http/main.ts'
import { BaseEvent, Emitter } from '../modules/events.ts'
import { serialize } from '../modules/transformers/main.ts'
import { type SerializeFn } from '../types/transformers.ts'
import type { ApplicationService, LoggerService } from '../src/types.ts'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.ts'

/**
 * Extend HTTP request class with the transform method
 */
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    serialize: SerializeFn
  }
}

/**
 * The Application Service provider registers all the baseline
 * features required to run the framework.
 *
 * This provider handles the registration of core services including:
 * - Application instance
 * - Logger and logger manager
 * - Configuration
 * - Event emitter
 * - Encryption service
 * - HTTP server and router
 * - Body parser middleware
 * - Dumper for debugging
 * - Test utilities and ACE kernel
 *
 * @example
 * const provider = new AppServiceProvider(app)
 * provider.register()
 * await provider.boot()
 * await provider.ready()
 */
export default class AppServiceProvider {
  /**
   * Application service provider constructor
   *
   * @param app - The application service instance
   */
  constructor(protected app: ApplicationService) {}

  /**
   * Registers test utils with the container
   *
   * Creates a singleton binding for 'testUtils' that lazily imports
   * and instantiates the TestUtils class when first accessed.
   *
   * @example
   * const testUtils = await app.container.make('testUtils')
   * testUtils.createHttpContext()
   */
  protected registerTestUtils() {
    this.app.container.singleton('testUtils', async () => {
      const { TestUtils } = await import('../src/test_utils/main.js')
      return new TestUtils(this.app)
    })
  }

  /**
   * Registers ace with the container
   *
   * Creates a singleton binding for 'ace' that lazily creates
   * the ACE kernel for command-line interface functionality.
   *
   * @example
   * const ace = await app.container.make('ace')
   * await ace.exec('make:controller', ['UserController'])
   */
  protected registerAce() {
    this.app.container.singleton('ace', async () => {
      const { createAceKernel } = await import('../modules/ace/create_kernel.js')
      return createAceKernel(this.app)
    })
  }

  /**
   * Registers the application to the container
   *
   * Binds the application instance as both a class binding and an alias.
   * This allows access to the app instance throughout the container.
   *
   * @example
   * const app = await container.make('app')
   * const appPath = app.makePath('tmp')
   */
  protected registerApp() {
    this.app.container.singleton(Application, () => this.app)
    this.app.container.alias('app', Application)
  }

  /**
   * Registers the logger class to resolve the default logger
   *
   * Creates a singleton binding for the Logger class that resolves
   * the default logger instance from the logger manager.
   *
   * @example
   * const logger = await container.make(Logger)
   * logger.info('Application started')
   */
  protected registerLogger() {
    this.app.container.singleton(Logger, async (resolver) => {
      const loggerManager = await resolver.make('logger')
      return loggerManager.use()
    })
  }

  /**
   * Registers the logger manager to the container
   *
   * Creates a singleton binding for 'logger' that instantiates
   * the LoggerManager with configuration from config/logger.ts
   *
   * @example
   * const loggerManager = await container.make('logger')
   * const fileLogger = loggerManager.use('file')
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
   *
   * Binds the application's config instance as both a class binding
   * and an alias, allowing access to configuration values.
   *
   * @example
   * const config = await container.make('config')
   * const appKey = config.get('app.appKey')
   */
  protected registerConfig() {
    this.app.container.singleton(Config, () => this.app.config)
    this.app.container.alias('config', Config)
  }

  /**
   * Registers emitter service to the container
   *
   * Creates a singleton binding for the event emitter that handles
   * application-wide event dispatching and listening.
   *
   * @example
   * const emitter = await container.make('emitter')
   * emitter.emit('user:created', { userId: 123 })
   */
  protected registerEmitter() {
    this.app.container.singleton(Emitter, async () => {
      return new Emitter(this.app) as Emitter<any>
    })
    this.app.container.alias('emitter', Emitter)
  }

  /**
   * Register the encryption service to the container
   *
   * Creates a singleton binding for the encryption service using
   * the app key from configuration for encryption/decryption operations.
   *
   * @example
   * const encryption = await container.make('encryption')
   * const encrypted = encryption.encrypt('sensitive data')
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
   *
   * Creates a singleton binding for the HTTP server that handles
   * incoming requests, with dependencies on encryption, emitter,
   * logger, and HTTP configuration.
   *
   * @example
   * const server = await container.make('server')
   * server.start()
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
   *
   * Creates a singleton binding for the router by getting it from
   * the HTTP server instance. The router handles URL routing.
   *
   * @example
   * const router = await container.make('router')
   * router.get('/', ({ response }) => response.send('Hello'))
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
   *
   * Binds the BodyParserMiddleware with bodyparser configuration
   * and experimental flags for parsing request bodies.
   *
   * @example
   * const middleware = await container.make(BodyParserMiddleware)
   * await middleware.handle(ctx, next)
   */
  protected registerBodyParserMiddleware() {
    this.app.container.bind(BodyParserMiddleware, () => {
      const config = this.app.config.get<any>('bodyparser')
      return new BodyParserMiddleware(config, this.app.experimentalFlags)
    })
  }

  /**
   * Registeres singleton instance of the "Dumper" module configured
   * via the "config/app.ts" file.
   *
   * The dumper is used for debugging and variable inspection with
   * configurable HTML and console output formats.
   *
   * @example
   * const dumper = await container.make('dumper')
   * dumper.dump({ user: { name: 'John' } })
   */
  protected registerDumper() {
    this.app.container.singleton(Dumper, async () => {
      const config = this.app.config.get<any>('app.dumper', {})
      const dumper = new Dumper(this.app)

      if (config.html) {
        dumper.configureHtmlOutput(config.html)
      }
      if (config.console) {
        dumper.configureAnsiOutput(config.console)
      }

      return dumper
    })

    this.app.container.alias('dumper', Dumper)
  }

  /**
   * Generates the types needed by the URL builder and writes
   * them to the ".adonisjs/server/routes.d.ts" file
   *
   * This method scans registered routes and generates TypeScript
   * types for type-safe URL generation in development.
   *
   * @param router - The router instance to generate types from
   *
   * @example
   * await generateRoutesTypes(router)
   * // Creates .adonisjs/server/routes.d.ts with route types
   */
  protected async generateRoutesTypes(router: Router) {
    const types = router.generateTypes(4)
    const outputPath = this.app.generatedServerPath('routes.d.ts')

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(
      outputPath,
      [
        `import '@adonisjs/core/types/http'`,
        '',
        `declare module '@adonisjs/core/types/http' {`,
        '  type ScannedRoutes = {',
        types,
        '  }',
        'export interface RoutesList extends ScannedRoutes {}',
        '}',
      ].join('\n')
    )
  }

  /**
   * Generates the routes JSON needed by the client integration
   *
   * Exports all registered routes as JSON for client-side
   * applications that need route information.
   *
   * @param router - The router instance to export routes from
   *
   * @example
   * await generateRoutesJSONFile(router)
   * // Creates .adonisjs/client/routes.json
   */
  protected async generateRoutesJSONFile(router: Router) {
    const routes = router.toJSON()
    const outputPath = this.app.makePath('.adonisjs/client/routes.json')

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, JSON.stringify(routes, null, 2))
  }

  /**
   * Registers bindings
   *
   * Called during the application bootstrap phase to register
   * all core service bindings with the IoC container.
   *
   * @example
   * const provider = new AppServiceProvider(app)
   * provider.register() // Registers all core services
   */
  register() {
    this.registerApp()
    this.registerAce()
    this.registerDumper()
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

  /**
   * Boot the service provider
   *
   * Called after all providers have been registered. Sets up
   * event emitter for BaseEvent and adds transform macro to HttpContext.
   *
   * @example
   * await provider.boot()
   * // Now HttpContext has transform method available
   */
  async boot() {
    BaseEvent.useEmitter(await this.app.container.make('emitter'))
    HttpContext.instanceProperty(
      'serialize',
      function (this: HttpContext, ...args: Parameters<SerializeFn>) {
        return serialize(...args) as any
      }
    )
  }

  /**
   * Called when the application is ready
   *
   * In non-production environments, generates route types and
   * JSON files for development tooling when router is committed.
   *
   * @example
   * await provider.ready()
   * // Route types and JSON generated in development
   */
  async ready() {
    if (!this.app.inProduction) {
      const router = await this.app.container.make('router')
      if (router.commited) {
        await this.generateRoutesJSONFile(router)
        await this.generateRoutesTypes(router)
      }
    }
  }
}
