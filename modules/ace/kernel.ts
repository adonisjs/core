/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel as AceKernel } from '@adonisjs/ace'
import { type BaseCommand, ListCommand } from './commands.ts'
import type { ApplicationService } from '../../src/types.ts'

/**
 * The Ace command kernel for AdonisJS applications. This kernel extends the base
 * Ace kernel with AdonisJS-specific functionality like dependency injection and
 * application lifecycle management.
 *
 * @example
 * ```ts
 * const app = new Application(new URL('../', import.meta.url))
 * const kernel = new Kernel(app)
 * 
 * await kernel.handle(['make:controller', 'UserController'])
 * ```
 */
export class Kernel extends AceKernel<typeof BaseCommand> {
  /**
   * Create a new Ace kernel instance
   * 
   * @param app - The AdonisJS application instance
   */
  constructor(public app: ApplicationService) {
    super(ListCommand, {
      create: async (command, parsedOutput, $kernel) => {
        return app.container.make(command, [app, $kernel, parsedOutput, $kernel.ui, $kernel.prompt])
      },

      run: (command) => command.exec(),
    })
  }
}
