/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Ace command line interface module for AdonisJS applications.
 * Provides the kernel, base commands, and utilities for building CLI applications.
 *
 * @example
 * // Create and use the Ace kernel
 * import { Kernel, BaseCommand } from '@adonisjs/core/ace'
 *
 * const kernel = new Kernel(app)
 * await kernel.handle(['make:controller', 'UserController'])
 *
 * @example
 * // Create a custom command
 * import { BaseCommand, args, flags } from '@adonisjs/core/ace'
 *
 * export default class MakeUser extends BaseCommand {
 *   static commandName = 'make:user'
 *   static description = 'Create a new user'
 *
 *   @args.string({ description: 'Name of the user' })
 *   declare name: string
 *
 *   @flags.boolean({ description: 'Create admin user' })
 *   declare admin: boolean
 *
 *   async run() {
 *     this.logger.info(`Creating user: ${this.name}`)
 *   }
 * }
 */
export { Kernel } from './kernel.ts'
export { BaseCommand, ListCommand } from './commands.ts'
export {
  args,
  flags,
  errors,
  cliui,
  Parser,
  FsLoader,
  ListLoader,
  cliHelpers,
  HelpCommand,
  IndexGenerator,
  tracingChannels,
} from '@adonisjs/ace'
