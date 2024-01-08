/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel as AceKernel } from '@adonisjs/ace'
import { BaseCommand, ListCommand } from './commands.js'
import type { ApplicationService } from '../../src/types.js'

/**
 * The base command to create custom ace commands. The AdonisJS base commands
 * receives the application instance
 */
export class Kernel extends AceKernel<typeof BaseCommand> {
  constructor(public app: ApplicationService) {
    super(ListCommand, {
      create: async (command, parsedOutput, $kernel) => {
        return app.container.make(command, [app, $kernel, parsedOutput, $kernel.ui, $kernel.prompt])
      },

      run: (command) => command.exec(),
    })
  }
}
