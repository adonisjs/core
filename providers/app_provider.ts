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
import { transform } from '../modules/transformers/main.ts'
import { type TransformFn } from '../types/transformers.ts'
import type { ApplicationService, LoggerService } from '../src/types.ts'
import BodyParserMiddleware from '../modules/bodyparser/bodyparser_middleware.ts'

/**
 * Extend HTTP request class with the transform method
 */
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    transform: TransformFn
  }
}

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
      return new BodyParserMiddleware(config, this.app.experimentalFlags)
    })
  }

  /**
   * Registeres singleton instance of the "Dumper" module configured
   * via the "config/app.ts" file.
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
   */
  protected async generateRoutesJSONFile(router: Router) {
    const routes = router.toJSON()
    const outputPath = this.app.makePath('.adonisjs/client/routes.json')

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, JSON.stringify(routes, null, 2))
  }

  /**
   * Registers bindings
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

  async boot() {
    BaseEvent.useEmitter(await this.app.container.make('emitter'))
    HttpContext.macro('transform', function (this: HttpContext, data, transformer, variant) {
      return transform(data, transformer, variant, this.containerResolver) as any
    })
  }

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
