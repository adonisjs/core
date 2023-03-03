#!/usr/bin/env node

/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import IndexCommand from './commands/index_commands.js'
import { Kernel, ListLoader, HelpCommand } from '@adonisjs/ace'

const kernel = Kernel.create()
kernel.addLoader(new ListLoader([IndexCommand]))

kernel.defineFlag('help', {
  type: 'boolean',
  description: HelpCommand.description,
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

await kernel.handle(process.argv.splice(2))
