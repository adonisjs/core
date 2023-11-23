/*
 * @adonisjs/ace
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kernel } from './main.js'
import type { ApplicationService } from '../../src/types.js'
import { FsLoader, HelpCommand, type BaseCommand } from '../../modules/ace/main.js'

/**
 * We abstract the logic for creating the ace kernel in this
 * file. So that both the "console" environment and rest
 * of the environments can configure and use ace.
 *
 * - In console environment, ace manages the lifecycle of the process
 * - In other environments, ace can be pulled from the container to
 * run commands
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
