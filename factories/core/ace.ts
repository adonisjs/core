/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IgnitorFactory } from './ignitor.js'
import { Ignitor } from '../../src/ignitor/main.js'
import type { IgnitorOptions } from '../../src/types.js'
import type { Kernel } from '../../modules/ace/kernel.js'
import { createAceKernel } from '../../modules/ace/create_kernel.js'

/**
 * Creates an instance of Ace kernel
 */
export class AceFactory {
  async make(ignitor: Ignitor): Promise<Kernel>
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
