/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from '../../src/ignitor/main.js'
import type { ProviderNode } from '../../types/app.js'
import { drivers } from '../../modules/hash/define_config.js'
import { defineConfig as defineHttpConfig } from '../../modules/http/main.js'
import type { ApplicationService, IgnitorOptions } from '../../src/types.js'
import { defineConfig as defineLoggerConfig } from '../../modules/logger.js'
import { defineConfig as defineHashConfig } from '../../modules/hash/main.js'
import { defineConfig as defineBodyParserConfig } from '../../modules/bodyparser/main.js'

type FactoryParameters = {
  rcFileContents: Record<string, any>
  config: Record<string, any>
}

/**
 * Ignitor factory creates an instance of the AdonisJS ignitor
 */
export class IgnitorFactory {
  #preloadActions: ((app: ApplicationService) => Promise<void> | void)[] = []
  #parameters: Partial<FactoryParameters> = {}

  /**
   * A flag to know if we should load the core providers
   */
  #loadCoreProviders: boolean = false

  /**
   * Define preload actions to run.
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
   * Merge custom factory parameters
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
   * Load core provider when booting the app
   */
  withCoreProviders(): this {
    this.#loadCoreProviders = true
    return this
  }

  /**
   * Merge default config for the core features. A shallow merge
   * is performed.
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
   * Create ignitor instance
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
