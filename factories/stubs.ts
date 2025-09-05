/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { AppFactory } from '@adonisjs/application/factories'

import { stubsRoot } from '../index.ts'
import type { ApplicationService } from '../src/types.ts'

type FactoryParameters = {
  app: ApplicationService
}

/**
 * Factory for preparing and processing stub templates from the "@adonisjs/core" package.
 * This factory is designed for internal testing and development purposes, utilizing
 * the core package's stub root directory.
 *
 * Note: This class is not published as it's intended for internal testing only.
 *
 * @example
 * ```ts
 * const stubsFactory = new StubsFactory()
 *
 * // Prepare a controller stub
 * const preparedStub = await stubsFactory.prepare('controller.stub', {
 *   filename: 'UserController',
 *   entity: { name: 'User' },
 *   resourceful: true
 * })
 *
 * console.log(preparedStub.contents)
 * ```
 */
export class StubsFactory {
  #parameters: Partial<FactoryParameters> = {}

  /**
   * Returns an instance of application, either from parameters or creates a default one
   */
  #getApp() {
    return this.#parameters.app || new AppFactory().create(new URL('./', import.meta.url))
  }

  /**
   * Merge custom factory parameters to override defaults.
   * This allows you to provide a custom application instance.
   *
   * @param params - Parameters to merge
   * @param params.app - Custom application service instance
   *
   * @example
   * ```ts
   * const customApp = new AppFactory().create(appRoot)
   * const stubsFactory = new StubsFactory().merge({ app: customApp })
   * ```
   */
  merge(params: Partial<FactoryParameters>): this {
    this.#parameters = Object.assign(this.#parameters, params)
    return this
  }

  /**
   * Prepare a stub template with the provided data and return the processed content.
   * This method initializes the application, loads the stub, and processes it with
   * the given template variables.
   *
   * @param stubPath - Path to the stub file relative to the stubs root
   * @param data - Template data to populate the stub placeholders
   *
   * @example
   * ```ts
   * const stubsFactory = new StubsFactory()
   * const preparedStub = await stubsFactory.prepare('controller.stub', {
   *   filename: 'UserController',
   *   entity: {
   *     name: 'User',
   *     modelName: 'User',
   *     pluralName: 'users'
   *   },
   *   resourceful: true
   * })
   *
   * // Access the processed stub content
   * console.log(preparedStub.contents)
   * ```
   */
  async prepare(stubPath: string, data: Record<string, any>) {
    const app = this.#getApp()
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build(stubPath, {
      source: stubsRoot,
    })
    return stub.prepare(data)
  }
}
