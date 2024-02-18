/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { AppFactory } from '@adonisjs/application/factories'

import { stubsRoot } from '../index.js'
import type { ApplicationService } from '../src/types.js'

type FactoryParameters = {
  app: ApplicationService
}

/**
 * Prepares stubs from "@adonisjs/core" package. We do not publish this class as it
 * is for internal testing only using the "stubsRoot" of the core package
 */
export class StubsFactory {
  #parameters: Partial<FactoryParameters> = {}

  /**
   * Returns an instance of application
   */
  #getApp() {
    return this.#parameters.app || new AppFactory().create(new URL('./', import.meta.url))
  }

  /**
   * Merge custom factory parameters
   */
  merge(params: Partial<FactoryParameters>): this {
    this.#parameters = Object.assign(this.#parameters, params)
    return this
  }

  /**
   * Prepares a stub
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
