/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IgnitorFactory } from './ignitor.ts'
import { Ignitor } from '../../src/ignitor/main.ts'
import type { IgnitorOptions } from '../../src/types.ts'
import type { Kernel } from '../../modules/ace/kernel.ts'
import { createAceKernel } from '../../modules/ace/create_kernel.ts'

/**
 * Factory for creating and configuring Ace command kernel instances.
 * This factory provides a convenient way to create Ace kernels either from
 * an existing Ignitor instance or by creating a new one from scratch.
 *
 * @example
 * ```ts
 * // Create from URL
 * const aceFactory = new AceFactory()
 * const kernel = await aceFactory.make(new URL('../', import.meta.url))
 *
 * // Create from existing ignitor
 * const ignitor = new Ignitor(appRoot)
 * const kernel = await aceFactory.make(ignitor)
 *
 * // Run commands
 * await kernel.handle(['make:controller', 'UserController'])
 * ```
 */
export class AceFactory {
  /**
   * Create an Ace kernel from an existing Ignitor instance
   *
   * @param ignitor - Existing Ignitor instance
   */
  async make(ignitor: Ignitor): Promise<Kernel>
  /**
   * Create an Ace kernel from application root URL
   *
   * @param appRoot - Application root directory URL
   * @param options - Optional Ignitor configuration options
   */
  async make(appRoot: URL, options?: IgnitorOptions): Promise<Kernel>
  async make(ignitorOrAppRoot: URL | Ignitor, options?: IgnitorOptions): Promise<Kernel> {
    if (ignitorOrAppRoot instanceof Ignitor) {
      const app = ignitorOrAppRoot.createApp('console')
      await app.init()
      return createAceKernel(app)
    }

    const app = new IgnitorFactory()
      .withCoreConfig()
      .withCoreProviders()
      .create(ignitorOrAppRoot, options!)
      .createApp('console')

    await app.init()
    return createAceKernel(app)
  }
}
