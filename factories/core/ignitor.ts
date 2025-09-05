/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from '../../src/ignitor/main.ts'
import type { ProviderNode } from '../../types/app.ts'
import { drivers } from '../../modules/hash/define_config.ts'
import { defineConfig as defineHttpConfig } from '../../modules/http/main.ts'
import type { ApplicationService, IgnitorOptions } from '../../src/types.ts'
import { defineConfig as defineLoggerConfig } from '../../modules/logger.ts'
import { defineConfig as defineHashConfig } from '../../modules/hash/main.ts'
import { defineConfig as defineBodyParserConfig } from '../../modules/bodyparser/main.ts'

type FactoryParameters = {
  rcFileContents: Record<string, any>
  config: Record<string, any>
}

/**
 * Factory for creating and configuring AdonisJS Ignitor instances.
 * This factory provides a fluent API to set up applications with core providers,
 * configurations, and preload actions for testing and development scenarios.
 *
 * @example
 * ```ts
 * const ignitor = new IgnitorFactory()
 *   .withCoreProviders()
 *   .withCoreConfig()
 *   .preload((app) => {
 *     // Custom initialization logic
 *   })
 *   .create(new URL('../', import.meta.url))
 *
 * const app = ignitor.createApp('web')
 * await app.boot()
 * ```
 */
export class IgnitorFactory {
  #preloadActions: ((app: ApplicationService) => Promise<void> | void)[] = []
  #parameters: Partial<FactoryParameters> = {}

  /**
   * A flag to know if we should load the core providers
   */
  #loadCoreProviders: boolean = false

  /**
   * Define preload actions to run during application initialization.
   * These actions are executed after the application is booted.
   *
   * @param action - Function to execute during preload phase
   *
   * @example
   * ```ts
   * factory.preload((app) => {
   *   // Register custom bindings
   *   app.container.bind('customService', () => new CustomService())
   * })
   * ```
   */
  preload(action: (app: ApplicationService) => void | Promise<void>): this {
    this.#preloadActions.push(action)
    return this
  }

  /**
   * Merge core providers with user defined providers
   */
  #mergeCoreProviders(providers?: ProviderNode['file'][]): ProviderNode['file'][] {
    const coreProviders: ProviderNode['file'][] = [
      () => import('@adonisjs/core/providers/app_provider'),
      () => import('@adonisjs/core/providers/hash_provider'),
      () => import('@adonisjs/core/providers/repl_provider'),
    ]

    return coreProviders.concat(providers || [])
  }

  /**
   * Merge custom factory parameters with existing ones.
   * This allows you to customize RC file contents and application configuration.
   *
   * @param params - Parameters to merge
   * @param params.config - Application configuration to merge
   * @param params.rcFileContents - RC file contents to merge
   *
   * @example
   * ```ts
   * factory.merge({
   *   config: {
   *     database: { connection: 'mysql' }
   *   },
   *   rcFileContents: {
   *     commands: ['./commands/CustomCommand']
   *   }
   * })
   * ```
   */
  merge(params: Partial<FactoryParameters>): this {
    if (params.config) {
      this.#parameters.config = Object.assign(this.#parameters.config || {}, params.config)
    }

    if (params.rcFileContents) {
      this.#parameters.rcFileContents = Object.assign(
        this.#parameters.rcFileContents || {},
        params.rcFileContents
      )
    }

    return this
  }

  /**
   * Include core AdonisJS providers when booting the application.
   * This adds essential providers like app, hash, and REPL providers.
   *
   * @example
   * ```ts
   * const ignitor = new IgnitorFactory()
   *   .withCoreProviders()
   *   .create(appRoot)
   * ```
   */
  withCoreProviders(): this {
    this.#loadCoreProviders = true
    return this
  }

  /**
   * Merge default configuration for core AdonisJS features.
   * This includes configurations for HTTP, hash, logger, and bodyparser.
   * A shallow merge is performed with existing config.
   *
   * @example
   * ```ts
   * const ignitor = new IgnitorFactory()
   *   .withCoreConfig()
   *   .create(appRoot)
   * ```
   */
  withCoreConfig(): this {
    this.merge({
      config: {
        app: {
          appKey: 'averylongrandomsecretkey',
          http: defineHttpConfig({}),
        },
        validator: {},
        bodyparser: defineBodyParserConfig({}),
        hash: defineHashConfig({
          default: 'scrypt',
          list: {
            scrypt: drivers.scrypt({}),
          },
        }),
        logger: defineLoggerConfig({
          default: 'app',
          loggers: {
            app: {},
          },
        }),
      },
    })
    return this
  }

  /**
   * Create a configured Ignitor instance with all specified parameters.
   *
   * @param appRoot - Application root directory URL
   * @param options - Optional Ignitor configuration options
   *
   * @example
   * ```ts
   * const ignitor = new IgnitorFactory()
   *   .withCoreConfig()
   *   .withCoreProviders()
   *   .create(new URL('../', import.meta.url))
   * ```
   */
  create(appRoot: URL, options?: IgnitorOptions): Ignitor {
    return new Ignitor(appRoot, options).tap((app) => {
      app.booted(async () => {
        for (let action of this.#preloadActions) {
          await action(app)
        }
      })

      if (this.#loadCoreProviders) {
        this.#parameters.rcFileContents = this.#parameters.rcFileContents || {}
        this.#parameters.rcFileContents.providers = this.#mergeCoreProviders(
          this.#parameters.rcFileContents.providers
        )
      }
      this.#parameters.rcFileContents && app.rcContents(this.#parameters.rcFileContents)
      this.#parameters.config && app.useConfig(this.#parameters.config)
    })
  }
}
