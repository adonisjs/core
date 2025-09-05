/*
 * @adonisjs/ace
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel } from './main.ts'
import type { ApplicationService } from '../../src/types.ts'
import { FsLoader, HelpCommand, type BaseCommand } from '../../modules/ace/main.ts'

/**
 * Create and configure an Ace command kernel for AdonisJS applications.
 * This function abstracts the kernel setup logic and can be used in different
 * environments with appropriate configurations.
 *
 * - In console environment, Ace manages the lifecycle of the process
 * - In other environments, Ace can be pulled from the container to run commands
 *
 * @param app - The AdonisJS application service instance
 * @param commandName - Optional specific command name for optimized loading
 *
 * @example
 * ```ts
 * const app = new Application(new URL('../', import.meta.url))
 * const kernel = createAceKernel(app)
 *
 * // Run a specific command
 * await kernel.handle(['make:controller', 'UserController'])
 * ```
 */
export function createAceKernel(app: ApplicationService, commandName?: string) {
  const kernel = new Kernel(app)
  kernel.info.set('binary', 'node ace')

  /**
   * Lazy import commands mentioned in the "commands" array
   * of rcFile
   */
  app.rcFile.commands.forEach((commandModule) => {
    kernel.addLoader(() =>
      typeof commandModule === 'function' ? commandModule() : app.import(commandModule)
    )
  })

  /**
   * When we know the command we are running ahead of time, then we
   * defer loading the application commands if the command has
   * already been registered by other loaders.
   */
  const fsLoader = new FsLoader<typeof BaseCommand>(app.commandsPath())
  kernel.addLoader({
    async getMetaData() {
      if (!commandName || !kernel.getCommand(commandName)) {
        return fsLoader.getMetaData()
      }
      return []
    },
    getCommand(command) {
      return fsLoader.getCommand(command)
    },
  })

  /**
   * Custom global flags
   */
  kernel.defineFlag('ansi', {
    type: 'boolean',
    showNegatedVariantInHelp: true,
    description: 'Force enable or disable colorful output',
  })

  kernel.defineFlag('help', {
    type: 'boolean',
    description: HelpCommand.description,
  })

  /**
   * Flag listener to turn colors on/off
   */
  kernel.on('ansi', (_, $kernel, parsed) => {
    if (parsed.flags.ansi === false) {
      $kernel.ui.switchMode('silent')
    }

    if (parsed.flags.ansi === true) {
      $kernel.ui.switchMode('normal')
    }
  })

  /**
   * Flag listener to display the help
   */
  kernel.on('help', async (command, $kernel, parsed) => {
    parsed.args.unshift(command.commandName)
    const help = new HelpCommand($kernel, parsed, kernel.ui, kernel.prompt)
    await help.exec()
    return $kernel.shortcircuit()
  })

  return kernel
}
